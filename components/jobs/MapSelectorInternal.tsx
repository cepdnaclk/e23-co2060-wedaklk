'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';

const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 }; // Sri Lanka approximate center
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface MapSelectorInternalProps {
  value?: { lat: number; lng: number } | null;
  radius?: number;
  readOnly?: boolean;
  height?: number;
  showRadius?: boolean; // Only show radius circle if this is true
  onChange?: (coords: { lat: number; lng: number }) => void;
}

// Component to handle map center updates when position changes
function MapUpdater({ center, zoom }: { center: google.maps.LatLngLiteral; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
}

// Component to handle Places Autocomplete
function PlaceAutocomplete({
  onPlaceSelect
}: {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void
}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

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
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search for a location..."
        className="w-full px-4 py-2 pr-10 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-500">
        <Search size={14} />
      </div>
    </div>
  );
}

export default function MapSelectorInternal({
  value = null,
  radius = 25,
  readOnly = false,
  height = 260,
  showRadius = false,
  onChange
}: MapSelectorInternalProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(value);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    setPosition(value);
  }, [value]);

  const handlePositionChange = useCallback((coords: { lat: number; lng: number }) => {
    setPosition(coords);
    onChange?.(coords);
  }, [onChange]);

  const handleMapClick = (ev: MapMouseEvent) => {
    if (!readOnly && ev.detail.latLng) {
      handlePositionChange({ lat: ev.detail.latLng.lat, lng: ev.detail.latLng.lng });
    }
  };

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry && place.geometry.location) {
      handlePositionChange({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleUseCurrent = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const coords = {
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        };
        handlePositionChange(coords);
        setIsLocating(false);
      },
      (error) => {
        setGeoError(error.message || 'Unable to retrieve your location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const center = position || DEFAULT_CENTER;
  const zoom = position ? 15 : 8;

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-[260px] flex items-center justify-center bg-slate-100 rounded-2xl border border-slate-200 text-slate-500 text-sm p-4 text-center">
        Google Maps API Key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="space-y-3">
        {!readOnly && (
          <div className="flex gap-2">
            <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} />
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            {position ? (
              <span>
                Selected location: <span className="font-semibold text-slate-900">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
              </span>
            ) : (
              <span>No location selected yet.</span>
            )}
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={handleUseCurrent}
              disabled={isLocating}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-emerald-200 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
            >
              {isLocating ? 'Locating…' : 'Use current location'}
            </button>
          )}
        </div>

        {geoError && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            {geoError}
          </div>
        )}

        <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height }}>
          <Map
            mapId={'DEMO_MAP_ID'} // You might want to create a real Map ID in Google Cloud Console
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={8}
            onClick={handleMapClick}
            disableDefaultUI={false}
            clickableIcons={false}
          >
            <MapUpdater center={center} zoom={zoom} />

            {position && (
              <AdvancedMarker position={position} />
            )}

            {position && showRadius && radius && (
              // Simple circle overlay using standard Google Maps Circle is not directly exported as a component in the advanced library yet in the same way,
              // but we can use a custom component or just omit if not strictly critical. 
              // For now we will focus on the marker. If Circle is needed, we'd wrap google.maps.Circle in a useEffect.
              null
            )}
          </Map>
        </div>

        {!readOnly && (
          <p className="text-xs text-slate-500">
            Click on the map or search to set a location.
          </p>
        )}
      </div>
    </APIProvider>
  );
}
