'use client';

// A brand's rating, and the stars a matched creator rates it with (mymatcher
// src/components/RateBrandSheet.tsx). Only a matched creator may rate.
import { useCallback, useEffect, useState } from 'react';
import { getBrandRating, rateBrand, removeBrandRating } from '@/lib/matchr/api';
import type { BrandRating as Rating } from '@/lib/matchr/types';
import { Spinner, errorText } from '../ui';
import { Icon } from '../icons';

export function BrandRating({ brandId }: { brandId: string }) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => getBrandRating(brandId).then(setRating).catch(() => setError('Could not load the rating.')), [brandId]);
  useEffect(() => { load(); }, [load]);

  const rate = async (score: number | null) => {
    setBusy(true);
    setError('');
    try {
      if (score == null) {
        await removeBrandRating(brandId);
        await load();
      } else {
        setRating(await rateBrand(brandId, score));
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (!rating) return error ? <p className="muted small">{error}</p> : <Spinner small />;
  const avg = rating.average != null ? Number(rating.average) : null;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p>
        {avg != null ? <><b style={{ fontSize: 22, display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#ffc400', display: 'inline-flex' }}><Icon name="star" size={20} filled /></span>{avg.toFixed(1)}</b> <span className="muted">from {rating.count} {rating.count === 1 ? 'creator' : 'creators'}</span></> : <span className="muted">No ratings yet</span>}
      </p>
      {rating.can_rate && (
        <div className="row">
          <span className="muted small">Your rating</span>
          <div className="stars" role="radiogroup" aria-label="Rate this brand">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={rating.my_score === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
                data-on={(rating.my_score ?? 0) >= n} disabled={busy} onClick={() => rate(n)}><Icon name="star" size={28} width={1.5} filled /></button>
            ))}
          </div>
          {rating.my_score != null && <button className="btn btn--ghost btn--sm" disabled={busy} onClick={() => rate(null)}>Clear</button>}
        </div>
      )}
      {error && <p className="danger-text small">{error}</p>}
    </div>
  );
}
