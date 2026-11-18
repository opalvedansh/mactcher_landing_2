'use client';

// Someone else's profile (mymatcher app/profile/[id].tsx). `?matchId=` means
// you already matched, so it offers Message instead of Interested.
import { useEffect, useState } from 'react';
import { Icon } from '@/components/portal/icons';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getProfileById, recordSwipe } from '@/lib/matchr/api';
import type { AnyProfile } from '@/lib/matchr/types';
import { useAuth } from '@/lib/matchr/auth';
import { openSafetyMenu } from '@/lib/matchr/safetyMenu';
import { ProfileView } from '@/components/portal/profile/ProfileView';
import { showAlert } from '@/components/portal/dialogs';
import { Spinner } from '@/components/portal/ui';

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const matchId = useSearchParams().get('matchId');
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<AnyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interested, setInterested] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id === user?.id) {
      router.replace('/app/profile');
      return;
    }
    setProfile(null);
    setError(null);
    getProfileById(id)
      .then(setProfile)
      // 404 also covers a blocked user, by design.
      .catch((e) => setError(e?.status === 404 ? 'This profile is not available.' : 'Could not load this profile.'));
  }, [id, user?.id, router]);

  if (error) return <div className="page"><div className="empty">{error}</div></div>;
  if (!profile) return <Spinner screen />;
  const name = profile.name || (profile.role === 'brand' ? 'this brand' : 'this creator');

  const interestedClick = async () => {
    if (interested || sending) return;
    setSending(true);
    try {
      const res = await recordSwipe(profile.user_id, 'like');
      setInterested(true);
      if (res.matched) {
        showAlert('You matched', `You and ${name} can talk now.`, [
          { text: 'Open chat', onPress: () => router.push(res.match?.match_id ? `/app/messages/${res.match.match_id}` : '/app/messages') },
          { text: 'Later', style: 'cancel' },
        ]);
      } else {
        showAlert('Interest sent', 'If they like you back, you will match and can start talking.');
      }
    } catch {
      showAlert('Could not send that', 'Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <div className="page__head">
        <button className="icon-btn" onClick={() => router.back()} aria-label="Back"><Icon name="back" /></button>
        <button className="icon-btn" aria-label="Report or block" onClick={() => openSafetyMenu({
          userId: profile.user_id, name, target: { type: 'user', id: profile.user_id }, onBlocked: () => router.replace('/app/home'),
        })}><Icon name="more" width={3} /></button>
      </div>
      <ProfileView
        profile={profile}
        own={false}
        headerActions={matchId ? (
          <button className="btn btn--primary" onClick={() => router.push(`/app/messages/${matchId}`)}>Message</button>
        ) : (
          <button className="btn btn--primary" disabled={interested || sending} onClick={interestedClick}>
            {sending ? <Spinner small /> : interested ? 'Interest sent' : 'Interested'}
          </button>
        )}
      />
    </div>
  );
}
