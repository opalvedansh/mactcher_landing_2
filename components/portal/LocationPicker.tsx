'use client';

// Ported from mymatcher src/components/LocationPicker.tsx: city search through
// the backend's Google Places proxy, then geocode the pick to lat/lng.
import { useEffect, useRef, useState } from 'react';
import { getMapAutocomplete, getMapGeocode } from '@/lib/matchr/api';
import { Spinner } from './ui';

export interface LocationResult {
  name: string;
  lat: number;
  lng: number;
}

interface Prediction { place_id: string; description: string }

export function LocationPicker({ value, onChange }: {
  value: LocationResult | null;
  /** Called with the resolved place, or a typed-only name (lat/lng 0) like the mobile fallback. */
  onChange: (location: LocationResult | null) => void;
}) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  // Bumped per change so a slow reply for older text can't overwrite newer suggestions.
  const requestId = useRef(0);
  const geocodeId = useRef(0);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    const id = ++requestId.current;
    const trimmed = query.trim();
    if (skipNextFetch.current || !trimmed || trimmed === value?.name) {
      skipNextFetch.current = false;
      setPredictions([]);
      setLoading(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getMapAutocomplete(trimmed, '(cities)');
        if (id === requestId.current) setPredictions(res.predictions ?? []);
      } catch (err) {
        console.error('[LocationPicker] Autocomplete error:', err);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const select = async (p: Prediction) => {
    const id = ++geocodeId.current;
    setPredictions([]);
    if (p.description !== query) skipNextFetch.current = true;
    setQuery(p.description);
    setResolving(true);
    try {
      const res = await getMapGeocode(p.place_id);
      const result = res.results?.[0];
      if (id !== geocodeId.current) return;
      if (result) {
        const { lat, lng } = result.geometry.location;
        onChange({ name: p.description, lat, lng });
      } else {
        onChange({ name: p.description, lat: 0, lng: 0 });
      }
    } catch (err) {
      console.error('[LocationPicker] Geocoding error:', err);
      if (id === geocodeId.current) onChange({ name: p.description, lat: 0, lng: 0 });
    } finally {
      if (id === geocodeId.current) setResolving(false);
    }
  };

  return (
    <div className="stack">
      <div className="row">
        <input
          className="input" placeholder="Search city or area…" aria-label="City" autoComplete="off"
          value={query}
          onChange={(e) => {
            geocodeId.current++;
            setResolving(false);
            setQuery(e.target.value);
            // Typed text without a pick still counts, like the mobile fallback.
            onChange(e.target.value.trim() ? { name: e.target.value.trim(), lat: 0, lng: 0 } : null);
          }}
        />
        {(loading || resolving) && <Spinner small />}
      </div>
      {predictions.length > 0 && (
        <div className="suggest" role="listbox">
          {predictions.map((p) => (
            <button key={p.place_id} type="button" role="option" aria-selected={false} onClick={() => select(p)}>
              {p.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
