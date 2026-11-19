'use client';

// Swipe deck for both roles: creators see brands (mymatcher SwipeScreen),
// brands see creators (BrandSwipeScreen).
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/matchr/auth';
import { useSwipeQueue, type SwipeDir } from '@/lib/matchr/useSwipeQueue';
import type { AnyProfile, BrandProfile, InfluencerProfile } from '@/lib/matchr/types';
import { SwipeDeck } from '@/components/portal/SwipeDeck';
import { ProfileCard, brandCard, creatorCard } from '@/components/portal/ProfileCard';
import { MatchModal } from '@/components/portal/MatchModal';
import { EmptyState, Spinner, useToast } from '@/components/portal/ui';
import { MatchrLogo } from '@/components/portal/icons';
import { NotificationBell } from '@/components/portal/NotificationBell';

export default function MatchPage() {
  const router = useRouter();
  const { onboardingData } = useAuth();
  const isBrand = onboardingData?.role === 'Brand';
  const cardOf = useCallback(
    (p: AnyProfile) => (isBrand ? creatorCard(p as InfluencerProfile) : brandCard(p as BrandProfile)),
    [isBrand],
  );
  const { deck, loading, error, loadingMore, loadFeed, commit } = useSwipeQueue<AnyProfile>((p) => cardOf(p).image);
  const [match, setMatch] = useState<{ id: string | null; name: string; avatar: string | null } | null>(null);
  const toast = useToast();

  const onSwipe = async (p: AnyProfile, dir: SwipeDir) => {
    try {
      const res = await commit(p, dir);
      if (dir === 'right' && res.matched) {
        const logoOrAvatar = 'logo_url' in p ? p.logo_url : (p as InfluencerProfile).avatar_url;
        setMatch({ id: res.match?.match_id ?? null, name: p.name ?? (isBrand ? 'This creator' : 'This brand'), avatar: logoOrAvatar || cardOf(p).image });
      }
    } catch (e) {
      console.warn('[API] recordSwipe failed:', e);
      toast.show('Swipe not saved. We brought the card back.');
    }
  };

  let body;
  // A page still on its way shows the spinner, not "you've seen everyone".
  if (loading || (deck.length === 0 && loadingMore)) body = <div className="center" style={{ minHeight: 400 }}><Spinner /></div>;
  else if (error) {
    body = (
      <EmptyState icon="cloudOff" tone="muted" title={isBrand ? "Couldn't load creators" : "Couldn't load brands"} body="Check your connection and try again."
        action={<button className="btn btn--outline" onClick={loadFeed}>Try again</button>} />
    );
  } else if (deck.length === 0) {
    body = (
      <EmptyState icon="check" title={isBrand ? "You've seen all creators" : "You've seen all brands"}
        body={isBrand ? 'New creators join every day. Check back soon.' : 'New brands join every day. Check back soon.'}
        action={<button className="btn btn--outline" onClick={loadFeed}>Refresh</button>} />
    );
  } else {
    body = (
      <SwipeDeck
        items={deck}
        keyOf={(p) => p.user_id}
        labelOf={(p) => p.name || (isBrand ? 'Creator' : 'Brand')}
        renderCard={(p) => <ProfileCard card={cardOf(p)} />}
        onSwipe={onSwipe}
        onOpen={(p) => router.push(`/app/profile/${p.user_id}`)}
      />
    );
  }

  return (
    <div className="page page--deck">
      {/* Phones only: the side nav carries the logo on wider screens. */}
      <div className="m-header">
        <span className="m-header__logo"><MatchrLogo size={34} /> Matchr</span>
        <NotificationBell />
      </div>
      <div className="deck-title">
        <h1>{isBrand ? 'Discover Influencers' : 'Discover Brands'}</h1>
        <p>{isBrand ? 'Find creators that match your brand' : 'Find brands that match your vibe'}</p>
      </div>
      {body}
      {match && (
        <MatchModal
          meAvatar={(isBrand ? onboardingData?.logo : onboardingData?.photos?.[0]) || null}
          meName={onboardingData?.name}
          themAvatar={match.avatar}
          themName={match.name}
          onClose={() => setMatch(null)}
          onIntroduce={() => router.push(match.id ? `/app/messages/${match.id}` : '/app/messages')}
        />
      )}
      {toast.node}
    </div>
  );
}
