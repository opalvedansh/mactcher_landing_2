'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/matchr/auth';
import { guardRedirect } from '@/lib/matchr/guard';
import { setPendingDeepLink, takePendingDeepLink } from '@/lib/matchr/pendingDeepLink';
import { Spinner } from './ui';
import { DialogHost } from './dialogs';

// Owns every auth-driven redirect (ported from AuthGuard in mymatcher
// app/_layout.tsx). Pages render only once the guard has nowhere to send
// them, so no screen ever calls the API without a session.
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingComplete, onboardingData, userDataError, passwordRecovery } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/app';

  const target = guardRedirect(
    {
      loading,
      signedIn: !!user,
      passwordRecovery,
      userDataError: !!userDataError,
      onboardingComplete,
      currentStep: onboardingData?.currentStep,
    },
    pathname,
  );

  useEffect(() => {
    if (!target) return;
    // A shared post link usually opens signed out; remember it so sign-in can
    // finish the trip instead of dropping them on the feed.
    if (!user && /^\/app\/p\/[^/]+$/.test(pathname)) setPendingDeepLink(pathname);
    if (target === '/app/home') {
      const pending = takePendingDeepLink();
      if (pending) {
        router.replace(pending);
        return;
      }
    }
    router.replace(target);
  }, [target, pathname, user, router]);

  if (loading || target) return <Spinner screen />;
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Pages read useSearchParams; this lets Next prerender their shells. */}
      <Suspense fallback={<Spinner screen />}>
        <AuthGuard>{children}</AuthGuard>
      </Suspense>
      <DialogHost />
    </AuthProvider>
  );
}
