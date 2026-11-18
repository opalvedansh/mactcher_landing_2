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
import { Spinner, useToast } from '@/components/portal/ui';

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
      <div className="empty stack" style={{ alignItems: 'center' }}>
        <p>Couldn&apos;t load profiles.</p>
        <button className="btn btn--primary" onClick={loadFeed}>Try again</button>
      </div>
    );
  } else if (deck.length === 0) {
    body = (
      <div className="empty stack" style={{ alignItems: 'center' }}>
        <p>You&apos;ve seen everyone for now.</p>
        <button className="btn btn--outline" onClick={loadFeed}>Refresh</button>
      </div>
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
      <div className="page__head">
        <h1 className="page__title">{isBrand ? 'Find creators' : 'Find brands'}</h1>
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
