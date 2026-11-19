'use client';

// The chat list (mymatcher src/screens/main/shared/ChatScreen.tsx): newest
// conversation first, kept live from the socket.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getMatches } from '@/lib/matchr/api';
import { socketService } from '@/lib/matchr/socket';
import { useAuth } from '@/lib/matchr/auth';
import { mapSame } from '@/lib/matchr/chat/useConversation';
import { describeMessage } from '@/lib/matchr/chat/format';
import { formatListTime } from '@/lib/matchr/utils/relativeTime';
import type { ChatMessage, MatchRecord } from '@/lib/matchr/types';
import { Avatar, EmptyState } from '../ui';
import { Icon, MatchrLogo, Verified } from '../icons';
import { NotificationBell } from '../NotificationBell';

const KIND_LABEL: Record<string, string> = { image: 'Photo', video: 'Video', audio: 'Voice message', document: 'Document' };

/** The chat-list preview fields for a message that just arrived or changed. */
function previewFields(msg: ChatMessage): Partial<MatchRecord> {
  const kind = msg.kind ?? 'text';
  return {
    last_message: msg.deleted_at ? '' : msg.content,
    last_message_at: msg.created_at,
    last_message_sender: msg.sender_id,
    last_message_read_at: msg.read_at ?? undefined,
    last_message_delivered_at: msg.delivered_at ?? null,
    last_message_kind: kind,
    last_message_label: kind === 'document' ? msg.attachment?.name || 'Document' : KIND_LABEL[kind] ?? null,
    last_message_duration_ms: msg.attachment?.duration_ms ?? null,
    last_message_deleted_at: msg.deleted_at ?? null,
  };
}

function previewText(m: MatchRecord, sentByMe: boolean) {
  if (m.last_message_deleted_at) return sentByMe ? 'You deleted this message' : 'This message was deleted';
  return describeMessage(m.last_message_kind, m.last_message || '', { label: m.last_message_label, duration_ms: m.last_message_duration_ms });
}

/** The other person in a match, from this user's side. */
export function matchPerson(m: MatchRecord, isBrand: boolean) {
  return isBrand
    ? { userId: m.influencer_id, name: m.influencer_name || 'Creator', avatar: m.influencer_avatar, verified: m.influencer_verified }
    : { userId: m.brand_id, name: m.brand_name || 'Brand', avatar: m.brand_logo, verified: m.brand_verified };
}

export function Inbox({ openMatchId }: { openMatchId: string | null }) {
  const { onboardingData, user } = useAuth();
  const isBrand = onboardingData?.role === 'Brand';
  const myId = user?.id;
  const [matches, setMatches] = useState<MatchRecord[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const openRef = useRef(openMatchId);
  openRef.current = openMatchId;

  const load = useCallback(async (silent = false) => {
    try {
      const res = await getMatches();
      const list = [...(res?.data ?? [])].sort((a, b) =>
        new Date(b.last_message_at || b.matched_at).getTime() - new Date(a.last_message_at || a.matched_at).getTime());
      setMatches(list);
      setError(false);
    } catch (e) {
      console.warn('Failed to load chats', e);
      if (!silent) setError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Leaving a conversation: refresh read state and previews quietly.
  useEffect(() => { if (matches) load(true); }, [openMatchId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    socketService.connect();
    const offs = [
      socketService.on('receive_message', (msg) => {
        if (!msg.match_id) return;
        setMatches((prev) => {
          if (!prev) return prev;
          const i = prev.findIndex((m) => m.match_id === msg.match_id);
          if (i < 0) {
            // A chat this list does not have yet (a brand-new match).
            load(true);
            return prev;
          }
          // An open chat only reads what arrives while it is actually on screen.
          const onScreen = openRef.current === msg.match_id && document.visibilityState === 'visible';
          const unseen = msg.sender_id !== myId && !onScreen;
          const m = prev[i];
          const updated = { ...m, ...previewFields(msg), unread_count: unseen ? (m.unread_count ?? 0) + 1 : m.unread_count };
          return [updated, ...prev.slice(0, i), ...prev.slice(i + 1)];
        });
      }),
      socketService.on('message_updated', (msg) => {
        setMatches((prev) => prev && mapSame(prev, (m) => (m.match_id === msg.match_id && m.last_message_at === msg.created_at && m.last_message_sender === msg.sender_id
          ? { ...m, ...previewFields(msg) } : m)));
      }),
      socketService.on('messages_read', ({ matchId, readerId, at }) => {
        setMatches((prev) => prev && mapSame(prev, (m) => {
          if (m.match_id !== matchId) return m;
          if (readerId === myId) return m.unread_count === 0 ? m : { ...m, unread_count: 0 };
          return m.last_message_sender === myId && !m.last_message_read_at ? { ...m, last_message_read_at: at } : m;
        }));
      }),
      socketService.on('messages_delivered', ({ matchId, at }) => {
        setMatches((prev) => prev && mapSame(prev, (m) => (m.match_id === matchId && m.last_message_sender === myId && !m.last_message_delivered_at
          ? { ...m, last_message_delivered_at: at } : m)));
      }),
      socketService.on('chat_cleared', () => load(true)),
      socketService.on('messages_hidden', () => load(true)),
      socketService.on('match_closed', () => load(true)),
      socketService.onReconnect(() => load(true)),
    ];
    return () => offs.forEach((off) => off());
  }, [myId, load]);

  const q = query.trim().toLowerCase();
  const shown = (matches ?? []).filter((m) => !q || matchPerson(m, isBrand).name.toLowerCase().includes(q));
  // Matches with no messages yet get the rail; a search lists everyone in one place.
  const fresh = q ? [] : shown.filter((m) => !m.last_message_at);
  const talking = q ? shown : shown.filter((m) => m.last_message_at);

  // Laid out like the app's chat list (mymatcher ChatScreen).
  return (
    <div className="inbox">
      {/* Phones: the brand header the other tabs use; the side nav carries it on wider screens. */}
      <div className="m-header">
        <span className="m-header__logo"><MatchrLogo size={34} /> Matchr</span>
        <NotificationBell />
      </div>
      <div className="screen-head screen-head--inbox"><h1>Messages</h1><span className="screen-head__bell"><NotificationBell /></span></div>
      <label className="search-pill">
        <Icon name="search" size={18} />
        <input type="search" placeholder="Search chats" aria-label="Search chats" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button type="button" className="search-pill__clear" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={14} width={2.6} /></button>}
      </label>
      {error ? (
        <EmptyState icon="cloudOff" tone="muted" title="Couldn't load your chats" body="Check your connection and try again."
          action={<button className="btn btn--outline" onClick={() => load()}>Try again</button>} />
      ) : !matches ? (
        <div aria-busy="true" aria-label="Loading chats">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="chat-row chat-row--skeleton"><span className="skel skel--avatar" /><span className="chat-row__main"><span className="skel" style={{ width: '45%' }} /><span className="skel" style={{ width: '75%', height: 12 }} /></span></div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState icon="chats" title="No conversations yet" body={isBrand ? 'When you match with a creator, you can chat here.' : 'When you match with a brand, you can chat here.'} />
      ) : shown.length === 0 ? (
        <p className="inbox__none">No chats match &ldquo;{query.trim()}&rdquo;</p>
      ) : (
        <>
        {fresh.length > 0 && (
          <section className="new-matches" aria-label="New matches">
            <h2>New matches<span>{fresh.length}</span></h2>
            <div className="new-matches__rail">
              {fresh.map((m) => {
                const person = matchPerson(m, isBrand);
                return (
                  <Link key={m.match_id} href={`/app/messages/${m.match_id}`} className="new-match" aria-label={`Say hello to ${person.name}`}>
                    {/* Square, so a brand's square logo is never cropped. */}
                    <span className="new-match__pic">
                      {person.avatar ? <img src={person.avatar} alt="" /> : <span className="new-match__initial">{person.name.charAt(0).toUpperCase()}</span>}
                      <span className="new-match__dot" aria-hidden="true" />
                    </span>
                    <span className="new-match__name ellipsis">{person.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {talking.length > 0 && fresh.length > 0 && <h2 className="inbox__label">Conversations</h2>}
        <div className="chat-list">
          {talking.map((m) => {
            const person = matchPerson(m, isBrand);
            const mine = m.last_message_sender === myId;
            const unread = m.unread_count ?? 0;
            const isNew = !m.last_message_at;
            const muted = !!m.muted_until && new Date(m.muted_until) > new Date();
            const ticks = mine && !m.last_message_deleted_at ? (m.last_message_read_at ? 'read' : m.last_message_delivered_at ? 'delivered' : 'sent') : null;
            return (
              <Link key={m.match_id} href={`/app/messages/${m.match_id}`} className="chat-row" aria-current={m.match_id === openMatchId ? 'true' : undefined}
                aria-label={`${person.name}${unread ? `, ${unread} unread` : ''}`}>
                <span className={isNew ? 'chat-row__avatar chat-row__avatar--new' : 'chat-row__avatar'}><Avatar src={person.avatar} name={person.name} size={56} /></span>
                <span className="chat-row__main">
                  <span className={unread ? 'chat-row__name chat-row__name--unread' : 'chat-row__name'}><span className="ellipsis">{person.name}</span>{person.verified && <Verified size={15} />}</span>
                  {isNew ? <span className="chat-row__new ellipsis">New match. Say hello.</span> : (
                    <span className="chat-row__preview">
                      {ticks && <span className={ticks === 'read' ? 'chat-row__tick chat-row__tick--read' : 'chat-row__tick'} aria-label={ticks === 'read' ? 'Read' : ticks === 'delivered' ? 'Delivered' : 'Sent'}><Icon name={ticks === 'sent' ? 'check' : 'checks'} size={16} /></span>}
                      <span className={`ellipsis${unread ? ' chat-row__text--unread' : ''}${m.last_message_deleted_at ? ' chat-row__text--deleted' : ''}`}>{previewText(m, mine)}</span>
                    </span>
                  )}
                </span>
                <span className="chat-row__meta">
                  <span className={unread && !muted ? 'chat-row__time chat-row__time--unread' : 'chat-row__time'}>{formatListTime(m.last_message_at || m.matched_at)}</span>
                  <span className="chat-row__badges">
                    {muted && <span className="chat-row__muted" aria-label="Muted"><Icon name="bellOff" size={14} /></span>}
                    {unread > 0 && <span className={muted ? 'chat-row__count chat-row__count--muted' : 'chat-row__count'}>{unread}</span>}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
