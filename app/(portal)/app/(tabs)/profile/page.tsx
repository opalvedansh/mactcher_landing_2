'use client';

// Your own profile (mymatcher Brand/InfluencerProfileScreen without
// publicUserId): view, edit, verify, and the account menu.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getMatchStats, getMatches, getMyProfile, getMyResponsiveness, syncInstagram,
} from '@/lib/matchr/api';
import type { AnyProfile, BrandProfile, InfluencerProfile, MatchRecord, MatchStats, Responsiveness } from '@/lib/matchr/types';
import { useAuth } from '@/lib/matchr/auth';
import { openAccountMenu } from '@/lib/matchr/safetyMenu';
import { ProfileView, Section } from '@/components/portal/profile/ProfileView';
import { EditProfile } from '@/components/portal/profile/EditProfile';
import { BusinessVerifyModal, FaceVerifyModal } from '@/components/portal/profile/Verify';
import { showAlert } from '@/components/portal/dialogs';
import { Avatar, Spinner, errorText } from '@/components/portal/ui';
import { Icon, Verified } from '@/components/portal/icons';

function formatReplyTime(seconds: number) {
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86400)} d`;
}

function BrandTools({ profile, onChange }: { profile: BrandProfile; onChange: (p: AnyProfile) => void }) {
  const [matches, setMatches] = useState<MatchRecord[] | null>(null);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [resp, setResp] = useState<Responsiveness | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    Promise.all([getMatches(), getMatchStats().catch(() => null)])
      .then(([list, s]) => { setMatches(list.data ?? []); setStats(s); })
      .catch(() => setMatches([]));
    getMyResponsiveness().then(setResp).catch(() => {});
  }, []);

  const status = profile.verification_status ?? 'none';
  return (
    <>
      <Section title="Verification and safety">
        {profile.verified ? <p className="row" style={{ gap: 6 }}><Verified /> Verified business</p>
          : status === 'pending' ? <p className="muted">Verification pending. We are checking your details.</p>
          : (
            <div className="stack" style={{ gap: 8 }}>
              {status === 'rejected' && <p className="danger-text small">We could not confirm those details.{profile.verification_note ? ` ${profile.verification_note}` : ''}</p>}
              <button className="btn btn--outline btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => setVerifying(true)}>Get verified</button>
            </div>
          )}
      </Section>
      <Section title="Your activity">
        <div className="stat-grid">
          <div className="stat"><b>{stats ? Number(stats.total_active) : '–'}</b><span className="muted small">Active matches</span></div>
          <div className="stat">
            <b>{resp?.response_rate != null ? `${resp.response_rate}%` : '–'}</b>
            <span className="muted small">{resp?.response_rate != null ? 'Reply rate' : 'Not enough replies yet'}</span>
          </div>
          {resp?.median_reply_seconds != null && (
            <div className="stat"><b>{formatReplyTime(resp.median_reply_seconds)}</b><span className="muted small">You usually reply within</span></div>
          )}
        </div>
      </Section>
      <Section title="Matched creators" action={matches && matches.length > 6 ? <Link className="small accent" href="/app/likes">View all</Link> : undefined}>
        {!matches ? <Spinner small /> : matches.length === 0 ? <p className="muted">No matches yet. Creators you match with show up here.</p> : (
          <div className="row wrap">
            {matches.slice(0, 6).map((m) => (
              <Link key={m.match_id} href={`/app/profile/${m.influencer_id}?matchId=${m.match_id}`} className="stack" style={{ alignItems: 'center', gap: 4, width: 80 }}>
                <Avatar src={m.influencer_avatar} name={m.influencer_name} size={56} />
                <span className="small ellipsis" style={{ maxWidth: 80 }}>{m.influencer_name}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>
      {verifying && (
        <BusinessVerifyModal onClose={() => setVerifying(false)} onSubmitted={(r) => {
          setVerifying(false);
          onChange({ ...profile, ...r });
          showAlert('Request sent', 'We are checking your details. The badge appears once they are confirmed.');
        }} />
      )}
    </>
  );
}

function CreatorTools({ profile, onChange }: { profile: InfluencerProfile; onChange: (p: AnyProfile) => void }) {
  const [faceCheck, setFaceCheck] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    if (!profile.instagram_handle) return;
    setSyncing(true);
    try {
      onChange(await syncInstagram(profile.instagram_handle));
    } catch (e) {
      showAlert('Could not sync Instagram', errorText(e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Section title="Verification">
        <div className="row wrap">
          {profile.verified ? <span className="row" style={{ gap: 6 }}><Verified /> Verified</span> : (
            <button className="btn btn--outline btn--sm" disabled={!profile.avatar_url && !(profile.photos ?? []).length} onClick={() => setFaceCheck(true)}>Verify with a selfie</button>
          )}
          {profile.instagram_handle && (
            <button className="btn btn--outline btn--sm" disabled={syncing} onClick={sync}>{syncing ? <Spinner small /> : 'Sync Instagram stats'}</button>
          )}
        </div>
        {!profile.verified && !profile.avatar_url && !(profile.photos ?? []).length && <p className="small muted" style={{ marginTop: 6 }}>Add a profile photo first: the selfie is compared with it.</p>}
      </Section>
      {faceCheck && (
        <FaceVerifyModal onClose={() => setFaceCheck(false)} onVerified={() => onChange({ ...profile, verified: true })} />
      )}
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

  return (
    <div className="page">
      <ProfileView
        profile={profile}
        own
        headerActions={(
          <>
            <button className="btn btn--primary btn--sm" onClick={() => setEditing(true)}>Edit profile</button>
            <button className="icon-btn" aria-label="Account options" onClick={() => openAccountMenu({ signOut, deleteAccount, email: user?.email })}><Icon name="more" width={3} /></button>
          </>
        )}
      >
        {profile.role === 'brand'
          ? <BrandTools profile={profile as BrandProfile} onChange={setProfile} />
          : <CreatorTools profile={profile as InfluencerProfile} onChange={setProfile} />}
      </ProfileView>
      {editing && <EditProfile profile={profile} onClose={() => setEditing(false)} onSaved={(p) => { setProfile(p); setEditing(false); }} />}
    </div>
  );
}
