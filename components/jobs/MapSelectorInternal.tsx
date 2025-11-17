'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search } from 'lucide-react';

const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 }; // Sri Lanka approximate center
const SRI_LANKA_BOUNDS: LatLngBoundsExpression = [
  [5.5, 79.5], // Southwest
  [10.0, 82.5], // Northeast
];

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapSelectorInternalProps {
  value?: { lat: number; lng: number } | null;
  radius?: number;
  readOnly?: boolean;
  height?: number;
  showRadius?: boolean; // Only show radius circle if this is true
  onChange?: (coords: { lat: number; lng: number }) => void;
}

function LocationMarker({ 
  position, 
  onPositionChange, 
  readOnly 
}: { 
  position: { lat: number; lng: number } | null;
  onPositionChange: (coords: { lat: number; lng: number }) => void;
  readOnly: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  return position ? <Marker position={[position.lat, position.lng] as LatLngExpression} /> : null;
}

function MapUpdater({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setPosition(value);
  }, [value]);

  const handlePositionChange = (coords: { lat: number; lng: number }) => {
    setPosition(coords);
    onChange?.(coords);
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

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=lk&limit=10&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      setSuggestions([]);
    }
  };

  const handleSearch = async (selectedSuggestion?: any) => {
    const queryToUse = selectedSuggestion ? selectedSuggestion.display_name : searchQuery;
    if (!queryToUse.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setShowSuggestions(false);

    try {
      let result = selectedSuggestion;
      if (!result) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
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
        handlePositionChange(coords);
        setSearchQuery(selectedSuggestion ? selectedSuggestion.display_name : '');
        setSuggestions([]);
      } else {
        setSearchError('Location not found. Please try a different search term.');
      }
    } catch (error) {
      setSearchError('Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const center: LatLngExpression = useMemo(() => {
    if (position) {
      return [position.lat, position.lng];
    }
    return [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
  }, [position]);

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchSuggestions(e.target.value);
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay to allow clicking on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search for a location..."
              className="w-full px-4 py-2 pr-10 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
            />
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search size={14} />
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSearch(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors text-black text-sm border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium">{suggestion.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {searchError && (
        <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
          {searchError}
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        <MapContainer
          center={center}
          zoom={position ? 13 : 8}
          minZoom={7}
          maxZoom={18}
          maxBounds={SRI_LANKA_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height }}
          scrollWheelZoom={true}
        >
          <MapUpdater center={center} zoom={position ? 13 : 11} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <LocationMarker 
            position={position} 
            onPositionChange={handlePositionChange}
            readOnly={readOnly}
          />
          
          {position && showRadius && radius && (
            <Circle
              center={[position.lat, position.lng] as LatLngExpression}
              radius={Math.max(1000, radius * 1000)}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          )}
        </MapContainer>
      </div>

      {!readOnly && (
        <p className="text-xs text-slate-500">
          Click on the map or search to set a location.
        </p>
      )}
    </div>
  );
}