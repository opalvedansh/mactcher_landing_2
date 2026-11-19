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
import { Avatar, EmptyState } from '@/components/portal/ui';
import { Icon, type IconName } from '@/components/portal/icons';

// The icon for each kind of notification, shown on the badge or in place of a picture.
const KIND: Record<string, { icon: IconName; filled?: boolean }> = {
  new_match: { icon: 'heart', filled: true }, new_like: { icon: 'heart', filled: true }, post_like: { icon: 'heart', filled: true },
  new_message: { icon: 'chats' }, post_comment: { icon: 'comment' }, comment_reply: { icon: 'comment' },
  story_mention: { icon: 'image' }, announcement: { icon: 'bell' },
};

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

  // Laid out like the app (mymatcher NotificationsScreen): back, title, then rows
  // with the sender's picture (or the kind's icon) and a dot while unread.
  return (
    <div className="page page--notifs">
      <div className="notifs-head">
        <button className="icon-btn" onClick={() => router.back()} aria-label="Back"><Icon name="back" /></button>
        <h1>Notifications</h1>
        {unread && <button className="notifs-head__all" onClick={() => markRead().catch(() => {})}>Mark all read</button>}
      </div>
      {error ? (
        <EmptyState icon="cloudOff" tone="muted" title="Couldn't load notifications" body="Check your connection and try again."
          action={<button className="btn btn--outline" onClick={load}>Try again</button>} />
      ) : !items ? (
        <div aria-busy="true" aria-label="Loading notifications">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="notif"><span className="skel skel--avatar" /><span className="notif__text"><span className="skel" style={{ width: '50%' }} /><span className="skel" style={{ width: '80%', height: 12 }} /></span></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="bell" title="You're all caught up" body="Matches, messages and likes will show up here." />
      ) : (
        <div className="notifs">
          {items.map((n) => {
            const kind = KIND[n.type] ?? KIND.announcement;
            return (
              <button key={n.id} className={n.read_at ? 'notif' : 'notif notif--unread'} onClick={() => open(n)}>
                <span className="notif__pic">
                  {n.actor_avatar ? <Avatar src={n.actor_avatar} name={n.actor_name || n.title} size={48} /> : (
                    <span className="notif__tile"><Icon name={kind.icon} size={22} filled={kind.filled} /></span>
                  )}
                  {n.actor_avatar && <span className="notif__badge"><Icon name={kind.icon} size={11} width={2.6} filled={kind.filled} /></span>}
                </span>
                <span className="notif__text">
                  <span className="notif__title">{n.title}</span>
                  <span className="notif__body">{n.body}</span>
                </span>
                <span className="notif__meta">
                  <span className="notif__time">{timeAgo(n.created_at)}</span>
                  {!n.read_at && <span className="notif__dot" aria-label="Unread" />}
                </span>
              </button>
            );
          })}
          {before && <button className="btn btn--ghost btn--sm notifs__more" onClick={more}>Load more</button>}
        </div>
      )}
    </div>
  );
}
