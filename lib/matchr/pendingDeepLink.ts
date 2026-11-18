/**
 * Holds the shared post a signed-out visitor opened, so sign-in can finish the
 * trip. sessionStorage, not memory: OAuth sign-in reloads the page. It is
 * per tab, so it never reopens weeks later.
 */
const KEY = 'matchr.pendingDeepLink';
// Only app-internal paths are honored, so a crafted link cannot aim the
// post-login redirect at an arbitrary target.
const SAFE_PATH = /^\/app\/[A-Za-z0-9\-._~/]*$/;

export function setPendingDeepLink(path: string) {
  try {
    if (SAFE_PATH.test(path)) sessionStorage.setItem(KEY, path);
  } catch {}
}

/** Returns the parked path and clears it, so it is only ever used once. */
export function takePendingDeepLink(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path && SAFE_PATH.test(path) ? path : null;
  } catch {
    return null;
  }
}
