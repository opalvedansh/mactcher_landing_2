'use client';

// Inbox beside the open chat on wide screens; one or the other on phones.
import { usePathname } from 'next/navigation';
import { Inbox } from '@/components/portal/chat/Inbox';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const openMatchId = (usePathname() || '').match(/^\/app\/messages\/([^/]+)/)?.[1] ?? null;
  return (
    <div className={openMatchId ? 'inbox-layout inbox-layout--open' : 'inbox-layout'}>
      <aside><Inbox openMatchId={openMatchId} /></aside>
      <section>{children}</section>
    </div>
  );
}
