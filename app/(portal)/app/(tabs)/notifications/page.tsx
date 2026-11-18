'use client';

// Inbox of notifications (mymatcher NotificationsScreen): open one to mark it
// read and go where it points; "Mark all read" clears the badge.
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getNotifications, markNotificationsRead } from '@/lib/matchr/api';
import type { AppNotification } from '@/lib/matchr/types';
import { notificationHref } from '@/lib/matchr/utils/notificationRoutes';
import { refreshUnreadNotifications } from '@/lib/matchr/useUnreadNotifications';
import { timeAgo } from '@/lib/matchr/utils/relativeTime';
import { Avatar, Spinner } from '@/components/portal/ui';

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [before, setBefore] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await getNotifications(30);
      setItems(res.data);
      setBefore(res.next_before);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const more = async () => {
    if (!before) return;
    const res = await getNotifications(30, before).catch(() => null);
    if (!res) return;
    setItems((i) => [...(i ?? []), ...res.data]);
    setBefore(res.next_before);
  };

  const markRead = async (ids?: string[]) => {
    const now = new Date().toISOString();
    setItems((list) => list?.map((n) => (!ids || ids.includes(n.id) ? { ...n, read_at: n.read_at ?? now } : n)) ?? list);
    try {
      await markNotificationsRead(ids);
    } finally {
      refreshUnreadNotifications();
    }
  };

  const open = (n: AppNotification) => {
    if (!n.read_at) markRead([n.id]).catch(() => {});
    router.push(notificationHref(n.type, n.match_id, n.actor_id));
  };

  const unread = items?.some((n) => !n.read_at);

  return (
    <div className="page">
      <div className="page__head">
        <h1 className="page__title">Notifications</h1>
        {unread && <button className="btn btn--ghost btn--sm accent" onClick={() => markRead().catch(() => {})}>Mark all read</button>}
      </div>
      {error ? (
        <div className="empty"><p>Couldn&apos;t load notifications.</p><button className="btn btn--outline" onClick={load}>Try again</button></div>
      ) : !items ? <Spinner /> : items.length === 0 ? <p className="empty">You&apos;re all caught up.</p> : (
        <div className="list">
          {items.map((n) => (
            <button key={n.id} className="list-item" style={{ border: 0, background: n.read_at ? 'none' : 'var(--accent-soft)', textAlign: 'left', cursor: 'pointer', marginBottom: 4 }} onClick={() => open(n)}>
              <Avatar src={n.actor_avatar} name={n.actor_name || n.title} size={44} />
              <div className="grow">
                <b>{n.title}</b>
                <p className="small muted">{n.body}</p>
              </div>
              <span className="small muted">{timeAgo(n.created_at)}</span>
            </button>
          ))}
          {before && <button className="btn btn--ghost btn--sm" onClick={more}>Load more</button>}
        </div>
      )}
    </div>
  );
}
