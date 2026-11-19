'use client';

// Ported from mymatcher src/screens/main/shared/LikesScreen.tsx: matches and
// likes received in one grid. Likes stay blurred without premium.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getLikesReceived, getMatches } from '@/lib/matchr/api';
import { useAuth } from '@/lib/matchr/auth';
import { categoryLabel } from '@/lib/matchr/options';
import { Spinner } from '@/components/portal/ui';
import { Icon, NavIcon, Verified } from '@/components/portal/icons';
import { NotificationBell } from '@/components/portal/NotificationBell';

type Card = {
  id: string; type: 'match' | 'like'; userId?: string; name?: string; avatar?: string; verified?: boolean; location?: string; niche?: string;
  followers?: number; engagement?: number; views?: number;
};

// The app's card format: 980, 12k, 1.5M.
const formatNum = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n));

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
      ? {
        name: r.influencer_name, avatar: r.influencer_avatar, verified: r.influencer_verified, location: r.influencer_location, niche: (r.influencer_categories || []).join(' · '),
        followers: Number(r.followers) || 0, engagement: Number(r.engagement_rate) || 0, views: Number(r.avg_views) || 0,
      }
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

  // Laid out like the app (mymatcher LikesScreen): big title, premium banner,
  // then a two-column grid of tall photo cards.
  return (
    <div className="page page--wide page--likes">
      <div className="likes-head"><h1>Likes</h1><NotificationBell /></div>
      {error ? <div className="alert">{error}</div> : !items ? <div className="center" style={{ minHeight: 300 }}><Spinner /></div> : (
        <>
          {!isPremium && hidden > 0 && (
            <div className="likes-premium">
              <span className="likes-premium__heart"><NavIcon name="heart" size={24} /></span>
              <h2>View your likes</h2>
              <p>{hidden} {hidden === 1 ? 'person likes' : 'people like'} you. Activate Matchr Premium and see the people whose likes you already have.</p>
            </div>
          )}
          {items.length === 0 ? <div className="empty">No likes or matches yet. Keep swiping!</div> : (
            <div className="likes-grid">
              {items.map((it) => {
                // A blurred card stays shut: opening it would show who is behind the blur.
                const blur = !isPremium && it.type === 'like';
                // Only figures we actually have; brands carry none.
                const stats = [
                  !!it.followers && { v: formatNum(it.followers), l: 'Flwrs' },
                  !!it.engagement && { v: `${it.engagement}%`, l: 'Eng' },
                  !!it.views && { v: formatNum(it.views), l: 'Views' },
                ].filter(Boolean) as { v: string; l: string }[];
                const inner = (
                  <>
                    {it.avatar ? <img src={it.avatar} alt="" /> : <span className="like-card__initial">{(it.name || '?').charAt(0)}</span>}
                    {!blur && (
                      <div className="like-card__info">
                        <b className="like-card__name"><span className="ellipsis">{it.name}</span>{it.verified && <Verified size={14} />}</b>
                        <span className="like-card__cats ellipsis">{it.niche || (isBrand ? 'Creator' : 'Brand')}</span>
                        {it.location && <span className="like-card__loc"><Icon name="pin" size={11} /><span className="ellipsis">{it.location}</span></span>}
                        {stats.length > 0 && (
                          <div className="like-card__stats">{stats.map((s) => <span key={s.l}><b>{s.v}</b>{s.l}</span>)}</div>
                        )}
                      </div>
                    )}
                  </>
                );
                return blur || !it.userId ? (
                  <div key={it.id} className={blur ? 'like-card like-card--blur' : 'like-card'} aria-label={blur ? 'Hidden like' : undefined}>{inner}</div>
                ) : (
                  <Link key={it.id} className="like-card" href={`/app/profile/${it.userId}${it.type === 'match' ? `?matchId=${it.id}` : ''}`}>{inner}</Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
