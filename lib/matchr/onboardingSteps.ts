/**
 * Onboarding order per role, as wired step by step in mymatcher
 * app/onboarding/*.tsx (each screen's goToStep / goBack). Route names are
 * dashed; currentStep in the saved draft uses underscores.
 */
export type OnboardingRole = 'Brand' | 'Influencer';

const SHARED = ['role-selection', 'name-input'];
export const STEPS: Record<OnboardingRole, string[]> = {
  Influencer: [...SHARED, 'dob-input', 'gender-input', 'social-platforms', 'categories', 'location', 'bio-input', 'photos', 'price-packages'],
  Brand: [...SHARED, 'brand-platforms', 'brand-location', 'brand-bio-input', 'brand-logo-upload', 'brand-campaign-upload', 'brand-categories'],
};

/** Before a role is picked only the shared steps exist; Influencer is the default branch. */
const stepsFor = (role: OnboardingRole | null | undefined) => STEPS[role ?? 'Influencer'];

/** The next step, or null when `step` is the last one (finish onboarding there). */
export function nextStep(role: OnboardingRole | null | undefined, step: string): string | null {
  const steps = stepsFor(role);
  const i = steps.indexOf(step);
  return i >= 0 && i < steps.length - 1 ? steps[i + 1] : null;
}

export function prevStep(role: OnboardingRole | null | undefined, step: string): string | null {
  const steps = stepsFor(role);
  const i = steps.indexOf(step);
  return i > 0 ? steps[i - 1] : null;
}

/** 1-based position and total, for the progress bar. */
export function stepProgress(role: OnboardingRole | null | undefined, step: string) {
  const steps = stepsFor(role);
  return { index: Math.max(steps.indexOf(step), 0) + 1, total: steps.length };
}

export const isStep = (step: string) => STEPS.Brand.includes(step) || STEPS.Influencer.includes(step);
