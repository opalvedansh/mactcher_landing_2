'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUnreadNotificationCount } from './api';

// The backend never pushes notifications over the socket to the web, so the
// badge polls: every minute while the tab is visible, and on returning to it.
const POLL_MS = 60_000;
const listeners = new Set<() => void>();

/** Tells every mounted badge to re-fetch (e.g. after items are marked read). */
export function refreshUnreadNotifications() {
  listeners.forEach((listener) => listener());
}

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    getUnreadNotificationCount()
      .then((res) => setCount(res.count ?? 0))
      .catch(() => {/* keep the last known count */});
  }, []);

  useEffect(() => {
    listeners.add(refresh);
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      refresh();
      if (!timer) timer = setInterval(refresh, POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      listeners.delete(refresh);
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  return count;
}
