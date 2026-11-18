'use client';

import Link from 'next/link';
import { useUnreadNotifications } from '@/lib/matchr/useUnreadNotifications';
import { Icon } from './icons';

export function NotificationBell() {
  const unread = useUnreadNotifications();
  return (
    <Link href="/app/notifications" className="icon-btn" style={{ position: 'relative' }} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
      <Icon name="bell" />
      {unread > 0 && <span className="badge" style={{ position: 'absolute', top: -2, right: -2 }}>{unread > 99 ? '99+' : unread}</span>}
    </Link>
  );
}
