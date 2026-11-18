// Self-check for the pure portal logic. Run: node --experimental-strip-types lib/matchr/checks.mts
import assert from 'node:assert/strict';
import { guardRedirect, type GuardState } from './guard.ts';
import { nextStep, prevStep } from './onboardingSteps.ts';
import { notificationHref } from './utils/notificationRoutes.ts';

const base: GuardState = { loading: false, signedIn: true, passwordRecovery: false, userDataError: false, onboardingComplete: true };

// Guard
assert.equal(guardRedirect({ ...base, loading: true }, '/app/home'), null);
assert.equal(guardRedirect({ ...base, signedIn: false }, '/app/home'), '/app/auth/login');
assert.equal(guardRedirect({ ...base, signedIn: false }, '/app/auth/login'), null);
assert.equal(guardRedirect({ ...base, passwordRecovery: true }, '/app/auth/login'), null);
assert.equal(guardRedirect({ ...base, userDataError: true }, '/app/home'), '/app');
assert.equal(guardRedirect({ ...base, userDataError: true }, '/app'), null);
assert.equal(guardRedirect({ ...base, onboardingComplete: false }, '/app/home'), '/app/onboarding/role-selection');
assert.equal(guardRedirect({ ...base, onboardingComplete: false, currentStep: 'bio_input' }, '/app'), '/app/onboarding/bio-input');
assert.equal(guardRedirect({ ...base, onboardingComplete: false, currentStep: 'bio_input' }, '/app/onboarding/photos'), null);
assert.equal(guardRedirect(base, '/app/auth/login'), '/app/home');
assert.equal(guardRedirect(base, '/app/onboarding/photos'), '/app/home');
assert.equal(guardRedirect(base, '/app'), '/app/home');
assert.equal(guardRedirect(base, '/app/messages/abc'), null);

// Onboarding order, matching each mobile screen's goToStep / goBack
assert.equal(nextStep(null, 'role-selection'), 'name-input');
assert.equal(nextStep('Brand', 'name-input'), 'brand-platforms');
assert.equal(nextStep('Influencer', 'name-input'), 'dob-input');
assert.equal(nextStep('Influencer', 'photos'), 'price-packages');
assert.equal(nextStep('Influencer', 'price-packages'), null);
assert.equal(nextStep('Brand', 'brand-categories'), null);
assert.equal(prevStep('Brand', 'brand-platforms'), 'name-input');
assert.equal(prevStep('Influencer', 'categories'), 'social-platforms');
assert.equal(prevStep('Brand', 'role-selection'), null);

// Notification links
assert.equal(notificationHref('new_like'), '/app/likes');
assert.equal(notificationHref('new_message', 'm1'), '/app/messages/m1');
assert.equal(notificationHref('new_message'), '/app/messages');
assert.equal(notificationHref('story_mention', null, 'u1'), '/app/home?story=u1');

console.log('portal checks passed');
