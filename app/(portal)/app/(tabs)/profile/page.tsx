'use client';

// Your own profile (mymatcher Brand/InfluencerProfileScreen without
// publicUserId): view, edit, verify, and the account menu.
import { useCallback, useEffect, useState } from 'react';
import { getMyProfile, syncInstagram } from '@/lib/matchr/api';
import type { AnyProfile, InfluencerProfile } from '@/lib/matchr/types';
import { useAuth } from '@/lib/matchr/auth';
import { openAccountMenu } from '@/lib/matchr/safetyMenu';
import { ProfileView } from '@/components/portal/profile/ProfileView';
import { EditProfile } from '@/components/portal/profile/EditProfile';
import { FaceVerifyModal } from '@/components/portal/profile/Verify';
import { showAlert } from '@/components/portal/dialogs';
import { Spinner, errorText } from '@/components/portal/ui';
import { Icon } from '@/components/portal/icons';

function SyncButton({ profile, onChange }: { profile: InfluencerProfile; onChange: (p: AnyProfile) => void }) {
  const [syncing, setSyncing] = useState(false);
  const handle = profile.instagram_handle;
  if (!handle) return null;

  const sync = async () => {
    setSyncing(true);
    try {
      onChange(await syncInstagram(handle));
    } catch (e) {
      showAlert('Could not sync Instagram', errorText(e));
    } finally {
      setSyncing(false);
    }
  };
  return (
    <button className="cp-sync" disabled={syncing} onClick={sync}>
      {syncing ? <Spinner small /> : <Icon name="rotateRight" size={14} width={2.4} />}{syncing ? 'Fetching Instagram stats…' : 'Sync stats from Instagram'}
    </button>
  );
}

// The app's pill beside an unverified name; verified shows as the badge there instead.
function VerifyPill({ profile, onChange }: { profile: InfluencerProfile; onChange: (p: AnyProfile) => void }) {
  const [faceCheck, setFaceCheck] = useState(false);
  const noPhoto = !profile.avatar_url && !(profile.photos ?? []).length;
  return (
    <>
      <button className="cp-verify-pill" onClick={() => (noPhoto
        ? showAlert('Add a profile photo first', 'The selfie is compared with it.')
        : setFaceCheck(true))}>Get Verified</button>
      {faceCheck && <FaceVerifyModal onClose={() => setFaceCheck(false)} onVerified={() => onChange({ ...profile, verified: true })} />}
    </>
  );
}

export default function MyProfilePage() {
  const { user, signOut, deleteAccount } = useAuth();
  const [profile, setProfile] = useState<AnyProfile | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    setError(false);
    getMyProfile().then(setProfile).catch(() => setError(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="page empty"><p>Couldn&apos;t load your profile.</p><button className="btn btn--outline" onClick={load}>Try again</button></div>;
  if (!profile) return <Spinner screen />;
  const creator = profile.role === 'brand' ? null : (profile as InfluencerProfile);

  return (
    <div className="page">
      <div className="page__head">
        <span />
        <div className="row">
          <button className="profile-edit" onClick={() => setEditing(true)}>Edit profile</button>
          <button className="icon-btn" aria-label="Account options" onClick={() => openAccountMenu({ signOut, deleteAccount, email: user?.email })}><Icon name="settings" size={20} /></button>
        </div>
      </div>
      <ProfileView
        profile={profile}
        own
        onEdit={() => setEditing(true)}
        onProfileChange={setProfile}
        nameExtra={creator && <VerifyPill profile={creator} onChange={setProfile} />}
      >
        {creator && <SyncButton profile={creator} onChange={setProfile} />}
      </ProfileView>
      {editing && <EditProfile profile={profile} onClose={() => setEditing(false)} onSaved={(p) => { setProfile(p); setEditing(false); }} />}
    </div>
  );
}
