'use client';

// Ported from mymatcher src/screens/main/shared/LikesScreen.tsx: matches and
// likes received in one grid. Likes stay blurred without premium.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getLikesReceived, getMatches } from '@/lib/matchr/api';
import { useAuth } from '@/lib/matchr/auth';
import { categoryLabel } from '@/lib/matchr/options';
import { Spinner } from '@/components/portal/ui';
import { Verified } from '@/components/portal/icons';

type Card = { id: string; type: 'match' | 'like'; userId?: string; name?: string; avatar?: string; verified?: boolean; location?: string; niche?: string };

// shortcut: premium is a hard-coded allow-list, copied from the mobile app (LikesScreen.tsx); move it to the backend when premium is built.
const PREMIUM_EMAILS = new Set(['vedanshlovesmom88@gmail.com']);

export default function LikesPage() {
  const { onboardingData, user } = useAuth();
  const isBrand = onboardingData?.role === 'Brand';
  const isPremium = PREMIUM_EMAILS.has(user?.email ?? '');
  const [items, setItems] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Newest request wins; an older one finishing late is ignored.
  const seqRef = useRef(0);

  const load = useCallback(async () => {
    const seq = ++seqRef.current;
    const [matchesRes, likesRes] = (await Promise.all([
      getMatches().catch(() => ({ data: [] })),
      getLikesReceived().catch(() => ({ data: [] })),
    ])) as any[];
    if (seq !== seqRef.current) return;
    const side = (r: any) => isBrand
      ? { name: r.influencer_name, avatar: r.influencer_avatar, verified: r.influencer_verified, location: r.influencer_location, niche: (r.influencer_categories || []).join(' · ') }
      : { name: r.brand_name, avatar: r.brand_logo, verified: r.brand_verified, location: r.brand_location, niche: (r.brand_categories || []).map(categoryLabel).join(' · ') };
    const matches: Card[] = (matchesRes?.data || []).map((m: any) => ({ id: m.match_id, type: 'match', userId: isBrand ? m.influencer_id : m.brand_id, ...side(m) }));
    const likes: Card[] = (likesRes?.data || []).map((l: any) => ({ id: l.swipe_id, type: 'like', userId: l.user_id, ...side(l) }));
    setItems([...matches, ...likes]);
    setError(null);
  }, [isBrand]);

  useEffect(() => {
    load().catch((e) => setError(e?.message ?? 'Failed to load likes'));
  }, [load]);

  const hidden = items?.filter((i) => i.type === 'like').length ?? 0;

  return (
    <div className="page page--wide">
      <div className="page__head"><h1 className="page__title">Likes</h1></div>
      {error ? <div className="alert">{error}</div> : !items ? <div className="center" style={{ minHeight: 300 }}><Spinner /></div> : (
        <>
          {!isPremium && hidden > 0 && (
            <div className="card stack" style={{ alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20 }}>{hidden} {hidden === 1 ? 'person likes' : 'people like'} you</h2>
              <p className="muted">Activate Matchr Premium and see the people whose likes you already have.</p>
            </div>
          )}
          {items.length === 0 ? <div className="empty">No likes or matches yet. Keep swiping!</div> : (
            <div className="grid-cards">
              {items.map((it) => {
                // A blurred card stays shut: opening it would show who is behind the blur.
                const blur = !isPremium && it.type === 'like';
                const inner = (
                  <>
                    {it.avatar ? <img src={it.avatar} alt="" /> : <div className="center" style={{ minHeight: '100%', fontSize: 40, color: 'var(--accent)' }}>{(it.name || '?').charAt(0)}</div>}
                    {!blur && (
                      <div className="tile__label">
                        {it.name}{it.verified && <Verified />}
                        {it.niche && <div className="small muted-2 ellipsis">{it.niche}</div>}
                        {it.type === 'match' && <div className="small accent">Matched</div>}
                      </div>
                    )}
                  </>
                );
                return blur || !it.userId ? (
                  <div key={it.id} className={blur ? 'tile tile--blur' : 'tile'} aria-label={blur ? 'Hidden like' : undefined}>{inner}</div>
                ) : (
                  <Link key={it.id} className="tile" href={`/app/profile/${it.userId}${it.type === 'match' ? `?matchId=${it.id}` : ''}`}>{inner}</Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
