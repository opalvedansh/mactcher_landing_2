/**
 * Where the auth guard sends someone, or null to let the page render.
 * Ported from AuthGuard in mymatcher app/_layout.tsx. `path` is the full URL
 * path, always under /app.
 */
export type GuardState = {
  loading: boolean;
  signedIn: boolean;
  passwordRecovery: boolean;
  userDataError: boolean;
  onboardingComplete: boolean;
  /** onboarding_data.currentStep, e.g. 'role_selection'. */
  currentStep?: string | null;
};

export function guardRedirect(s: GuardState, path: string): string | null {
  if (s.loading) return null;
  const p = path.replace(/^\/app/, '') || '/';
  const inAuth = p.startsWith('/auth');
  const inOnboarding = p.startsWith('/onboarding');
  const atIndex = p === '/';

  // Verifying a recovery code signs the user in. Hold them on the auth
  // screen until they have actually set the new password they came for.
  if (s.passwordRecovery) return null;

  if (!s.signedIn) return inAuth ? null : '/app/auth/login';

  // Without their saved state we can't know where they belong; the index
  // screen offers a retry instead of dropping them at role selection.
  if (s.userDataError) return atIndex ? null : '/app';

  if (!s.onboardingComplete) {
    // Only steer them into onboarding from outside it: `currentStep` trails
    // the screen they are actually on.
    return inOnboarding ? null : `/app/onboarding/${(s.currentStep || 'role_selection').replace(/_/g, '-')}`;
  }

  return inAuth || inOnboarding || atIndex ? '/app/home' : null;
}
