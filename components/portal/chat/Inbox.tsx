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
import { Avatar, Spinner } from '../ui';
import { Icon, Verified } from '../icons';

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

  return (
    <div className="stack" style={{ padding: 16 }}>
      <h1 className="page__title">Messages</h1>
      <input className="input" type="search" placeholder="Search" aria-label="Search chats" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error ? (
        <button className="btn btn--outline" onClick={() => load()}>Couldn&apos;t load chats. Try again</button>
      ) : !matches ? <Spinner /> : shown.length === 0 ? (
        <p className="empty">{q ? 'No chats match that name.' : 'No matches yet. When you match, your chats show up here.'}</p>
      ) : (
        <div className="list">
          {shown.map((m) => {
            const person = matchPerson(m, isBrand);
            const mine = m.last_message_sender === myId;
            const unread = m.unread_count ?? 0;
            return (
              <Link key={m.match_id} href={`/app/messages/${m.match_id}`} className="list-item"
                style={m.match_id === openMatchId ? { background: 'var(--surface-2)' } : undefined}>
                <Avatar src={person.avatar} name={person.name} size={48} />
                <div className="grow">
                  <div className="row row--between">
                    <b className="ellipsis">{person.name}{person.verified && <Verified size={14} />}</b>
                    <span className="small muted">{formatListTime(m.last_message_at || m.matched_at)}</span>
                  </div>
                  <div className="row row--between">
                    <span className={unread ? 'ellipsis small' : 'ellipsis small muted'} style={unread ? { fontWeight: 700 } : undefined}>
                      {m.last_message_at ? `${mine ? 'You: ' : ''}${previewText(m, mine)}` : 'New match. Say hi!'}
                    </span>
                    {unread > 0 && <span className="badge">{unread}</span>}
                    {m.muted_until && <span className="small muted" aria-label="Muted"><Icon name="bellOff" size={14} /></span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
