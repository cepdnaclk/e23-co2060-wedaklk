'use client';

import { useCallback, useEffect, useMemo, useState, Suspense, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Loader2, MapPin, AlertCircle, PlusCircle, Search } from 'lucide-react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import JobCard from '@/components/jobs/JobCard';
import JobFilter from '@/components/jobs/JobFilter';
import { JOB_CATEGORIES } from '@/components/jobs/constants';

interface JobResponse {
  _id: string;
  title: string;
  description: string;
  category: string;
  priceRange: { min: number; max: number };
  location: { type: 'Point'; coordinates: [number, number] };
  address?: string;
  radius: number;
  photos: string[];
  createdBy: {
    userId: string;
    name: string;
  };
  status: 'open' | 'accepted' | 'completed';
  distance?: number | null;
  createdAt: string;
}

const DEFAULT_RADIUS = 25;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function PlaceAutocomplete({
  onPlaceSelect,
  defaultValue = ''
}: {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  defaultValue?: string;
}) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address'],
      componentRestrictions: { country: 'lk' }, // Restrict to Sri Lanka
    };

    setAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onPlaceSelect(place);
      setInputValue(place.formatted_address || place.name || '');
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [autocomplete, onPlaceSelect]);

  return (
    <div className="flex gap-2 w-full">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter area or location in Sri Lanka (e.g., Colombo, Kandy)"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
        />
      </div>
      <button
        onClick={() => {
          // Trigger search if needed, but autocomplete usually handles it. 
          // We can keep this button as a visual indicator or to force a search if the user typed but didn't select.
          // For now, we rely on selection.
          const event = new KeyboardEvent('keydown', { key: 'Enter' });
          inputRef.current?.dispatchEvent(event);
        }}
        className="px-6 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Search
      </button>
    </div>
  );
}

function JobsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [searchArea, setSearchArea] = useState('');
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isVerified = Boolean((session?.user as any)?.isVerified);

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry && place.geometry.location) {
      const coords = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setSearchLocation(coords);
      setSearchArea(place.formatted_address || place.name || '');
      setLocationError(null);
    } else {
      setLocationError('Please select a valid location from the suggestions.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) return;
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (geoError) => {
        console.warn('Geolocation error', geoError);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      // Use search location if available, otherwise use user's current location
      const locationToUse = searchLocation || userLocation;
      if (locationToUse) {
        params.set('lat', locationToUse.lat.toString());
        params.set('lng', locationToUse.lng.toString());
        params.set('radius', radius.toString());
      }
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      if (session?.user?.id) {
        params.set('excludeUser', session.user.id);
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load jobs');
      }

      setJobs(data.jobs || []);
    } catch (err: any) {
      console.error('Failed to fetch jobs', err);
      setError(err.message || 'Unable to retrieve jobs right now.');
    } finally {
      setIsLoading(false);
    }
  }, [radius, selectedCategory, session?.user?.id, searchLocation?.lat, searchLocation?.lng, userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, searchParams?.toString()]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setRadius(DEFAULT_RADIUS);
    setSearchArea('');
    setSearchLocation(null);
  };

  const distanceEnabled = Boolean(searchLocation || userLocation);

  const jobCountLabel = useMemo(() => {
    if (isLoading) return 'Loading jobs…';
    if (jobs.length === 0) return 'No matching jobs at the moment';
    return `${jobs.length} job${jobs.length === 1 ? '' : 's'} found`;
  }, [isLoading, jobs.length]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-200">
        Google Maps API Key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-emerald-600 font-semibold">
              <Briefcase size={16} />
              Explore tasks near you
            </div>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Job Marketplace</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Find opportunities posted by customers in your area. Bid on tasks that match your skills and availability.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!isVerified && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                <AlertCircle size={16} />
                <span>Account pending verification</span>
              </div>
            )}
            <Link
              href={isVerified ? '/dashboard/jobs/create' : '#'}
              onClick={(event) => {
                if (!isVerified) {
                  event.preventDefault();
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-5 py-3 text-sm font-semibold shadow-lg hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={!isVerified}
            >
              <PlusCircle size={18} />
              Post a job
            </Link>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Area
            </label>
            <div className="relative">
              <PlaceAutocomplete
                onPlaceSelect={handlePlaceSelect}
                defaultValue={searchArea}
              />
            </div>
            {searchLocation && (
              <p className="text-xs text-emerald-600 mt-2">
                Searching jobs near: {searchArea}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Radius: {radius} km
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
                disabled={!searchLocation && !userLocation}
              />
              <span className="text-xs text-slate-500 min-w-[60px] text-right">1-100 km</span>
            </div>
            {!searchLocation && !userLocation && (
              <p className="text-xs text-amber-600 mt-1">
                Enter an area first to enable radius search
              </p>
            )}
          </div>
        </div>

        {locationError && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <MapPin size={16} />
            <span>{locationError}</span>
          </div>
        )}

        <JobFilter
          categories={Array.from(JOB_CATEGORIES)}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onReset={handleResetFilters}
        />

        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{jobCountLabel}</span>
          {distanceEnabled && (
            <span>Results within {radius} km {searchLocation ? `of ${searchArea}` : 'of your location'}</span>
          )}
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 bg-white border border-slate-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase size={28} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No jobs match your filters yet</h3>
            <p className="text-sm text-slate-500 mt-2">
              Try adjusting your radius or check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onClick={(jobId) => {
                  const query = new URLSearchParams();
                  const locationToUse = searchLocation || userLocation;
                  if (locationToUse) {
                    query.set('lat', locationToUse.lat.toString());
                    query.set('lng', locationToUse.lng.toString());
                  }
                  router.push(`/dashboard/jobs/${jobId}?${query.toString()}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </APIProvider>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
        <Loader2 className="mx-auto animate-spin text-emerald-500" size={32} />
        <p className="mt-3 text-sm text-slate-500">Loading jobs…</p>
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}
