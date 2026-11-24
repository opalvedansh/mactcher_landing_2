// Self-check for the pure portal logic. Run: node --experimental-strip-types lib/matchr/checks.mts
import assert from 'node:assert/strict';
import { guardRedirect, type GuardState } from './guard.ts';
import { nextStep, prevStep } from './onboardingSteps.ts';
import { notificationHref } from './utils/notificationRoutes.ts';
import { arrowHead, clockNow, dateNow, keepInClip, pathFromPoints, pathPoints, strokeHit, strokeWidthFor, type Stroke } from './story.ts';

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

// Story drawing and stickers
const line: Stroke = { brush: 'pen', color: '#fff', width: 10, d: pathFromPoints([{ x: 0, y: 0 }, { x: 100, y: 0 }]) };
assert.equal(strokeHit(line, { x: 100, y: 20 }, 20), true);
assert.equal(strokeHit(line, { x: 100, y: 60 }, 20), false);
assert.equal(strokeWidthFor('eraser', 0), 40);
assert.equal(strokeWidthFor('marker', 1), 110);
const pts = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 400, y: 0 }];
assert.equal(pathPoints(pathFromPoints(pts) + arrowHead(pts, 14)).at(-2)?.x, 400); // an arrow's head is part of its `d`, tip at the stroke's end
assert.equal(clockNow(new Date(2026, 0, 5, 0, 7)), '12:07 AM');
assert.equal(dateNow(new Date(2026, 10, 25)), 'NOV 25');
const song = { currentTime: 25.2 };
keepInClip(song, 10);
assert.equal(song.currentTime, 10);
song.currentTime = 24;
keepInClip(song, 10);
assert.equal(song.currentTime, 24);

console.log('portal checks passed');
