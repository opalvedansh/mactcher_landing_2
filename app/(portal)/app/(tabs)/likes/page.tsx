'use client';

// From mymatcher src/screens/main/shared/LikesScreen.tsx: matches and likes
// received, filterable, in the app's photo-card grid. Likes stay blurred
// without premium; the hero counts them but never reveals a face.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { getLikesReceived, getMatches } from '@/lib/matchr/api';
import { useAuth } from '@/lib/matchr/auth';
import { categoryLabel } from '@/lib/matchr/options';
import { EmptyState } from '@/components/portal/ui';
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
  const [filter, setFilter] = useState<'all' | 'matches' | 'likes'>('all');
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

  const matches = items?.filter((i) => i.type === 'match') ?? [];
  const likes = items?.filter((i) => i.type === 'like') ?? [];
  const hiddenLikes = isPremium ? [] : likes;
  const other = isBrand ? 'creator' : 'brand';
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  const card = (it: Card, i: number) => {
    // A blurred card stays shut: opening it would show who is behind the blur.
    const blur = !isPremium && it.type === 'like';
    // Only figures we actually have; brands carry none.
    const stats = [
      !!it.followers && { v: formatNum(it.followers), l: 'Flwrs' },
      !!it.engagement && { v: `${it.engagement}%`, l: 'Eng' },
      !!it.views && { v: formatNum(it.views), l: 'Views' },
    ].filter(Boolean) as { v: string; l: string }[];
    return (
      <article key={it.id} className={blur ? 'like-card like-card--blur' : 'like-card'} style={{ '--i': Math.min(i, 8) } as CSSProperties}>
        {it.avatar ? <img src={it.avatar} alt="" /> : <span className="like-card__initial">{(it.name || '?').charAt(0)}</span>}
        {blur ? (
          <span className="like-card__veil"><span className="like-card__veil-heart"><NavIcon name="heart" size={18} /></span>Liked you</span>
        ) : (
          <>
            {it.type === 'match' && <span className="like-card__chip">Matched</span>}
            <div className="like-card__info">
              <b className="like-card__name"><span className="ellipsis">{it.name}</span>{it.verified && <Verified size={14} />}</b>
              <span className="like-card__cats ellipsis">{it.niche || (isBrand ? 'Creator' : 'Brand')}</span>
              {it.location && <span className="like-card__loc"><Icon name="pin" size={11} /><span className="ellipsis">{it.location}</span></span>}
              {stats.length > 0 && <div className="like-card__stats">{stats.map((s) => <span key={s.l}><b>{s.v}</b>{s.l}</span>)}</div>}
            </div>
            {it.userId && <Link className="like-card__open" href={`/app/profile/${it.userId}${it.type === 'match' ? `?matchId=${it.id}` : ''}`} aria-label={`Open ${it.name || `this ${other}`}'s profile`} />}
            {it.type === 'match' && (
              <Link className="like-card__chat" href={`/app/messages/${it.id}`} aria-label={`Message ${it.name || `this ${other}`}`}><NavIcon name="message" size={17} /></Link>
            )}
          </>
        )}
      </article>
    );
  };

  const section = (title: string, list: Card[]) => list.length > 0 && (
    <section className="likes-section">
      {filter === 'all' && <h2 className="likes-section__title">{title}<span>{list.length}</span></h2>}
      <div className="likes-grid">{list.map(card)}</div>
    </section>
  );

  return (
    <div className="page page--wide page--likes">
      <div className="likes-head">
        <div>
          <h1>Likes</h1>
          {items && items.length > 0 && <p className="likes-head__sub">{plural(matches.length, 'match', 'matches')} · {plural(likes.length, 'like', 'likes')} received</p>}
        </div>
        <NotificationBell />
      </div>
      {error ? <EmptyState icon="cloudOff" tone="muted" title="Couldn't load your likes" body="Check your connection and try again." action={<button className="btn btn--outline" onClick={() => load().catch(() => {})}>Try again</button>} /> : !items ? (
        <div className="likes-grid" aria-busy="true" aria-label="Loading likes">{[0, 1, 2, 3].map((i) => <div key={i} className="like-card like-card--skeleton" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon="heart" title="No likes yet" body={`${isBrand ? 'Creators' : 'Brands'} who like you and your matches show up here.`}
          action={<Link href="/app/match" className="btn btn--outline">Keep swiping</Link>} />
      ) : (
        <>
          {hiddenLikes.length > 0 && filter !== 'matches' && (
            // The faces stay blurred; the stack only says how many are waiting.
            <div className="likes-hero">
              <div className="likes-hero__fan" aria-hidden="true">
                {hiddenLikes.slice(0, 3).map((l, i) => (
                  <span key={l.id} className="likes-hero__card" style={{ '--i': i - Math.min(hiddenLikes.length, 3) / 2 + 0.5 } as CSSProperties}>
                    {l.avatar && <img src={l.avatar} alt="" />}
                  </span>
                ))}
                <span className="likes-hero__heart"><NavIcon name="heart" size={22} /></span>
              </div>
              <h2>{hiddenLikes.length === 1 ? `A ${other} likes you` : `${hiddenLikes.length} ${other}s like you`}</h2>
              <p>Matchr Premium shows you who they are. Until then, keep swiping: like them back on Match and you&apos;ll match.</p>
              <Link href="/app/match" className="likes-hero__cta">Go to Match</Link>
            </div>
          )}
          {matches.length > 0 && likes.length > 0 && (
            <div className="segmented" role="tablist" aria-label="Show">
              {([['all', 'All', items.length], ['matches', 'Matches', matches.length], ['likes', 'Liked you', likes.length]] as const).map(([k, label, n]) => (
                <button key={k} role="tab" aria-selected={filter === k} className="segmented__item" onClick={() => setFilter(k)}>{label}<span>{n}</span></button>
              ))}
            </div>
          )}
          {filter !== 'likes' && section('Matches', matches)}
          {filter !== 'matches' && section('Liked you', likes)}
        </>
      )}
    </div>
  );
}
