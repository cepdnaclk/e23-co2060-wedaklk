'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Loader2, MapPin, AlertCircle, PlusCircle } from 'lucide-react';
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

export default function JobsPage() {
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
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isVerified = Boolean((session?.user as any)?.isVerified);

  const fetchSearchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=lk&limit=8&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchArea = async (selectedSuggestion?: any) => {
    const queryToUse = selectedSuggestion ? selectedSuggestion.display_name : searchArea;
    if (!queryToUse.trim()) return;

    setIsSearchingLocation(true);
    setLocationError(null);
    setShowSuggestions(false);

    try {
      let result = selectedSuggestion;
      if (!result) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchArea
          )}&countrycodes=lk&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          result = data[0];
        }
      }

      if (result) {
        const coords = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
        setSearchLocation(coords);
        setSearchArea(selectedSuggestion ? selectedSuggestion.display_name : searchArea);
        setLocationError(null);
      } else {
        setLocationError('Location not found. Please try a different search term.');
        setSearchLocation(null);
      }
    } catch (error) {
      setLocationError('Failed to search location. Please try again.');
      setSearchLocation(null);
    } finally {
      setIsSearchingLocation(false);
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

  return (
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
            <div className="flex gap-2">
              <input
                type="text"
                value={searchArea}
                onChange={(e) => {
                  setSearchArea(e.target.value);
                  fetchSearchSuggestions(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchArea();
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Enter area or location in Sri Lanka (e.g., Colombo, Kandy)"
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
              />
              <button
                onClick={() => handleSearchArea()}
                disabled={isSearchingLocation || !searchArea.trim()}
                className="px-6 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearchingLocation ? 'Searching...' : 'Search'}
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSearchArea(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors text-black text-sm border-b border-slate-100 last:border-b-0"
                  >
                    {suggestion.display_name}
                  </button>
                ))}
              </div>
            )}
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
  );
}
