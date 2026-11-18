'use client';

// Ported from mymatcher src/screens/main/influencer/CreatorReviews.tsx: brand
// reviews of a creator. Whether the viewer may write one is the server's call.
import { useCallback, useEffect, useState } from 'react';
import { getCreatorReviews, removeCreatorReview, reviewCreator } from '@/lib/matchr/api';
import type { CreatorReviews as Reviews } from '@/lib/matchr/types';
import { showAlert } from '../dialogs';
import { Avatar, Spinner, errorText } from '../ui';
import { Verified } from '../icons';

const QUOTE_MIN = 10;
const QUOTE_MAX = 600;

export function CreatorReviews({ creatorId, isOwnProfile }: { creatorId: string; isOwnProfile: boolean }) {
  const [data, setData] = useState<Reviews | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ quote: '', name: '', title: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setData(await getCreatorReviews(creatorId));
    } catch (e) {
      console.warn('[API] getCreatorReviews failed:', e);
      setFailed(true);
    }
  }, [creatorId]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<Reviews>) => {
    setBusy(true);
    setError('');
    try {
      setData(await fn());
      setEditing(false);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (failed) return <button className="btn btn--outline" onClick={load}>Couldn&apos;t load reviews. Try again</button>;
  if (!data) return <Spinner small />;

  const { reviews, my_review: mine, can_review: canReview } = data;
  const quoteLen = draft.quote.trim().length;
  const startEdit = () => {
    setDraft(mine ? { quote: mine.quote, name: mine.reviewer_name, title: mine.reviewer_title || '' } : { quote: '', name: '', title: '' });
    setEditing(true);
  };
  const submit = () => {
    if (quoteLen < QUOTE_MIN) return setError(`Add at least ${QUOTE_MIN} characters.`);
    if (quoteLen > QUOTE_MAX) return setError(`Keep it under ${QUOTE_MAX} characters.`);
    if (!draft.name.trim()) return setError('Add your name.');
    run(() => reviewCreator(creatorId, { quote: draft.quote.trim(), reviewer_name: draft.name.trim(), reviewer_title: draft.title.trim() || null }));
  };

  return (
    <div className="stack">
      {reviews.length === 0 && !canReview && (
        <p className="muted">{isOwnProfile ? 'No reviews yet. Brands you match with can review your work here.' : 'No reviews yet.'}</p>
      )}
      {reviews.map((r) => (
        <div key={r.id} className="card stack" style={{ gap: 8 }}>
          <p>“{r.quote}”</p>
          <div className="row">
            <Avatar src={r.brand_logo_url} name={r.reviewer_name} size={32} />
            <div className="grow">
              <b>{r.reviewer_name}</b>
              <div className="muted small">{[r.reviewer_title, r.brand_name].filter(Boolean).join(' · ')}{r.brand_verified && <Verified size={12} />}</div>
            </div>
          </div>
        </div>
      ))}
      {canReview && !editing && (
        <div className="row">
          <button className="btn btn--outline btn--sm" onClick={startEdit}>{mine ? 'Edit your review' : 'Write a review'}</button>
          {mine && (
            <button className="btn btn--ghost btn--sm" onClick={() => showAlert('Remove your review?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => run(() => removeCreatorReview(creatorId)) },
            ])}>Remove</button>
          )}
        </div>
      )}
      {editing && (
        <div className="card stack">
          {error && <div className="alert">{error}</div>}
          <label className="field"><span>Your review</span>
            <textarea className="textarea" value={draft.quote} maxLength={QUOTE_MAX + 50} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} />
          </label>
          <p className="small muted" style={{ textAlign: 'right' }}>{quoteLen}/{QUOTE_MAX}</p>
          <label className="field"><span>Your name</span>
            <input className="input" maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="field"><span>Your title (optional)</span>
            <input className="input" maxLength={100} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <div className="row">
            <button className="btn btn--primary" disabled={busy || !quoteLen || !draft.name.trim()} onClick={submit}>{busy ? <Spinner small /> : 'Save review'}</button>
            <button className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
