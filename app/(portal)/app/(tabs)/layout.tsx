'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, MatchrLogo, NavIcon, type NavIconName } from '@/components/portal/icons';
import { useUnreadNotifications } from '@/lib/matchr/useUnreadNotifications';

// Same tabs, same order as the mobile app. One set of routes serves both roles.
const TABS: { href: string; label: string; icon: NavIconName }[] = [
  { href: '/app/match', label: 'Match', icon: 'match' },
  { href: '/app/home', label: 'Home', icon: 'home' },
  { href: '/app/likes', label: 'Likes', icon: 'heart' },
  { href: '/app/messages', label: 'Messages', icon: 'message' },
  { href: '/app/profile', label: 'Profile', icon: 'profile' },
];

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const unread = useUnreadNotifications();
  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <Link href="/app/home" className="nav__brand"><MatchrLogo size={30} /> Matchr</Link>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="nav__link" aria-current={isOn(t.href) ? 'page' : undefined} aria-label={t.label}>
            <NavIcon name={t.icon} size={22} />
            <span className="nav__label">{t.label}</span>
          </Link>
        ))}
        <div className="nav__spacer" />
        <Link href="/app/notifications" className="nav__link nav__extra" aria-current={isOn('/app/notifications') ? 'page' : undefined}>
          <Icon name="bell" size={22} />
          {unread > 0 && <span className="badge">{unread > 99 ? '99+' : unread}</span>}
          <span className="nav__label">Notifications</span>
        </Link>
        <Link href="/app/create-post" className="nav__link nav__extra" aria-current={isOn('/app/create-post') ? 'page' : undefined}>
          <Icon name="plus" size={22} />
          <span className="nav__label">New post</span>
        </Link>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
