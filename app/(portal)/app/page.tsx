'use client';

import { useAuth } from '@/lib/matchr/auth';
import { Spinner } from '@/components/portal/ui';

// The guard sends everyone onward from here; this screen only shows while
// their saved state could not be loaded (ported from mymatcher app/index.tsx).
export default function PortalIndex() {
  const { userDataError, retryUserData, signOut } = useAuth();
  if (!userDataError) return <Spinner screen />;
  return (
    <div className="center">
      <div className="stack" style={{ maxWidth: 360 }}>
        <h1>Can&apos;t reach Matchr</h1>
        <p className="muted">{userDataError}</p>
        <button className="btn btn--primary" onClick={retryUserData}>Retry</button>
        <button className="btn btn--ghost" onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
