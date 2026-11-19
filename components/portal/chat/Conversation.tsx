'use client';

// One conversation (mymatcher src/screens/main/shared/ConversationScreen.tsx):
// live thread, attachments, voice notes, replies, edits, reactions, forwards,
// and the chat menu (mute, clear, rate, report, block).
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearChat, getMatches, muteChat } from '@/lib/matchr/api';
import { useConversation } from '@/lib/matchr/chat/useConversation';
import { canDeleteForEveryone, canEdit, MAX_BYTES, QUICK_REACTIONS } from '@/lib/matchr/chat/actions';
import { describeMessage, formatLastSeen, guessMime } from '@/lib/matchr/chat/format';
import type { LocalFile } from '@/lib/matchr/chat/upload';
import type { ChatMessage, MatchRecord, MuteDuration } from '@/lib/matchr/types';
import { askReportReason, confirmBlock } from '@/lib/matchr/safetyMenu';
import { showAlert } from '../dialogs';
import { Avatar, Modal, Spinner } from '../ui';
import { BrandRating } from '../profile/BrandRating';
import { MessageBubble } from './MessageBubble';
import { matchPerson } from './Inbox';
import { useVoiceRecorder } from './useVoiceRecorder';
import { Icon, Verified } from '../icons';

const MB = 1024 * 1024;
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};

function toLocalFile(f: File): LocalFile {
  const mime = f.type || guessMime(f.name);
  const kind = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'document';
  return { kind, uri: URL.createObjectURL(f), mime, name: f.name, size: f.size, webFile: f };
}

function ForwardModal({ myMatchId, isBrand, onClose, onForward }: {
  myMatchId: string; isBrand: boolean; onClose: () => void; onForward: (ids: string[]) => void;
}) {
  const [list, setList] = useState<MatchRecord[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => { getMatches().then((r) => setList(r.data ?? [])).catch(() => setList([])); }, []);
  return (
    <Modal title="Forward to" onClose={onClose}>
      {!list ? <Spinner /> : (
        <div className="stack">
          <div className="list">
            {list.map((m) => {
              const p = matchPerson(m, isBrand);
              const on = picked.includes(m.match_id);
              return (
                <button key={m.match_id} className="list-item" style={{ border: 0, background: on ? 'var(--accent-soft)' : 'none', cursor: 'pointer', textAlign: 'left' }}
                  aria-pressed={on} disabled={!on && picked.length >= 5}
                  onClick={() => setPicked(on ? picked.filter((x) => x !== m.match_id) : [...picked, m.match_id])}>
                  <Avatar src={p.avatar} name={p.name} size={36} />
                  <span className="grow">{p.name}{m.match_id === myMatchId ? ' (this chat)' : ''}</span>
                  {on && <Icon name="check" size={16} />}
                </button>
              );
            })}
          </div>
          <p className="small muted">Up to 5 chats.</p>
          <button className="btn btn--primary" disabled={!picked.length} onClick={() => onForward(picked)}>Forward</button>
        </div>
      )}
    </Modal>
  );
}

// Two messages read as one run when the same person sent them within a few minutes.
const RUN_MS = 5 * 60_000;
const runs = (a: ChatMessage | undefined, b: ChatMessage) =>
  !!a && a.sender_id === b.sender_id && new Date(b.created_at).getTime() - new Date(a.created_at).getTime() < RUN_MS;

export function Conversation({ match, myId, isBrand }: { match: MatchRecord; myId: string; isBrand: boolean }) {
  const router = useRouter();
  const matchId = match.match_id;
  const other = matchPerson(match, isBrand);
  const chat = useConversation({ matchId, myId, otherUserId: other.userId });
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [acting, setActing] = useState<ChatMessage | null>(null);
  const [forwarding, setForwarding] = useState<ChatMessage | null>(null);
  const [menu, setMenu] = useState<null | 'main' | 'mute' | 'rate'>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Stay pinned to the newest message unless the person scrolled up to read.
  const nearBottom = useRef(true);
  const olderAnchor = useRef<number | null>(null);

  const voice = useVoiceRecorder(
    (file) => sendFiles([file], ''),
    (msg) => showAlert('Microphone unavailable', msg),
  );
  useEffect(() => { chat.notifyRecording(voice.recording); }, [voice.recording]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (olderAnchor.current != null) {
      // Older page prepended: keep the same message under the reader's eye.
      el.scrollTop = el.scrollHeight - olderAnchor.current;
      olderAnchor.current = null;
    } else if (nearBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chat.messages, chat.otherTyping]);

  const sendFiles = (files: LocalFile[], caption: string) => {
    const big = files.find((f) => (f.size ?? 0) > MAX_BYTES[f.kind]);
    if (big) {
      showAlert('File too large', `${big.kind === 'image' ? 'Photos' : big.kind === 'video' ? 'Videos' : 'Files'} can be up to ${MAX_BYTES[big.kind] / MB} MB.`);
      return;
    }
    nearBottom.current = true;
    chat.sendFiles(files, caption, replyTo);
    setReplyTo(null);
  };

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    if (editing) {
      chat.edit(editing, t);
      setEditing(null);
    } else {
      nearBottom.current = true;
      chat.sendText(t, replyTo);
      setReplyTo(null);
    }
    setText('');
    chat.notifyTyping(false);
  };

  const setMute = async (duration: MuteDuration | null) => {
    setMenu(null);
    try {
      const res = await muteChat(matchId, duration);
      chat.setMemberState((s) => ({ cleared_at: s?.cleared_at ?? null, muted_until: res.muted_until }));
    } catch {
      showAlert('Could not update notifications', 'Please try again.');
    }
  };

  const confirmClear = () => {
    setMenu(null);
    showAlert('Clear this chat?', `Messages disappear for you only. ${other.name} still has them.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear chat', style: 'destructive',
        onPress: async () => {
          try {
            await clearChat(matchId);
            chat.reload();
          } catch {
            showAlert('Could not clear the chat', 'Please try again.');
          }
        },
      },
    ]);
  };

  const muted = !!chat.memberState?.muted_until && new Date(chat.memberState.muted_until) > new Date();
  const status = chat.otherTyping
    ? (chat.otherTyping === 'audio' ? 'recording audio…' : 'typing…')
    : chat.presence?.online ? 'online' : formatLastSeen(chat.presence?.last_seen_at);
  const profileHref = `/app/profile/${other.userId}?matchId=${matchId}`;

  let lastDay = '';
  const a = acting;

  return (
    <div className="chat">
      <header className="chat__head">
        <button className="icon-btn" onClick={() => router.push('/app/messages')} aria-label="Back to chats"><Icon name="back" /></button>
        <Link href={profileHref} className="row grow" style={{ minWidth: 0 }}>
          <Avatar src={other.avatar} name={other.name} size={40} />
          <div className="grow">
            <b className="ellipsis" style={{ display: 'block' }}>{other.name}{other.verified && <Verified size={14} />}</b>
            {status && <span className={chat.otherTyping ? 'typing' : 'small muted'}>{status}</span>}
          </div>
        </Link>
        {muted && <span aria-label="Muted" className="muted"><Icon name="bellOff" size={16} /></span>}
        <button className="icon-btn" onClick={() => setMenu('main')} aria-label="Chat options"><Icon name="more" width={3} /></button>
      </header>

      <div
        className="chat__body" ref={bodyRef} aria-live="polite"
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
      >
        {chat.loading ? <div className="center" style={{ minHeight: 200 }}><Spinner /></div> : chat.error ? (
          <div className="empty"><p>Couldn&apos;t load messages.</p><button className="btn btn--outline" onClick={chat.reload}>Try again</button></div>
        ) : (
          <>
            {chat.hasMore && (
              <button className="btn btn--ghost btn--sm" style={{ alignSelf: 'center' }} disabled={chat.loadingOlder}
                onClick={() => {
                  const el = bodyRef.current;
                  if (el) olderAnchor.current = el.scrollHeight - el.scrollTop;
                  chat.loadOlder();
                }}>
                {chat.loadingOlder ? <Spinner small /> : 'Load earlier messages'}
              </button>
            )}
            {chat.messages.length === 0 && <p className="empty">You matched with {other.name}. Say hi!</p>}
            {chat.messages.map((m, i) => {
              const day = dayLabel(m.created_at);
              const showDay = day !== lastDay;
              lastDay = day;
              const prev = chat.messages[i - 1];
              const next = chat.messages[i + 1];
              return (
                <Fragment key={m.id}>
                  {showDay && <div className="day-sep"><span>{day}</span></div>}
                  {m.id === chat.firstUnreadId && <div className="unread-sep"><span>Unread messages</span></div>}
                  <MessageBubble
                    m={m} mine={m.sender_id === myId}
                    joinTop={!showDay && m.id !== chat.firstUnreadId && runs(prev, m)}
                    joinBottom={!!next && next.id !== chat.firstUnreadId && dayLabel(next.created_at) === day && runs(m, next)}
                    send={chat.sendStates[m.client_msg_id ?? m.id.replace(/^temp-/, '')]}
                    onOpenActions={setActing} onRetry={chat.retry} onDiscard={chat.discard}
                  />
                </Fragment>
              );
            })}
          </>
        )}
      </div>

      <footer className="chat__foot">
        {chat.closed ? (
          <p className="muted" style={{ textAlign: 'center', padding: 8 }}>This conversation has ended.</p>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {(replyTo || editing) && (
              <div className="row small" style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '8px 12px' }}>
                <span className="grow ellipsis">
                  <b className="accent">{editing ? 'Editing' : `Replying to ${replyTo!.sender_id === myId ? 'yourself' : other.name}`}</b>{' '}
                  {describeMessage((editing ?? replyTo)!.kind, (editing ?? replyTo)!.content, { name: (editing ?? replyTo)!.attachment?.name })}
                </span>
                <button className="icon-btn" style={{ width: 28, height: 28 }} aria-label="Cancel"
                  onClick={() => { setReplyTo(null); if (editing) { setEditing(null); setText(''); } }}><Icon name="close" size={14} width={2.6} /></button>
              </div>
            )}
            {voice.recording ? (
              <div className="composer">
                <span className="grow typing row" style={{ gap: 8 }}><span className="rec-dot" aria-hidden="true" />Recording…</span>
                <button className="btn btn--ghost btn--sm" onClick={() => voice.stop(true)}>Cancel</button>
                <button className="btn btn--primary btn--sm" onClick={() => voice.stop()}>Send</button>
              </div>
            ) : (
              <div className="composer">
                <input ref={fileRef} type="file" hidden multiple
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  onChange={(e) => {
                    const files = [...(e.target.files ?? [])].map(toLocalFile);
                    e.target.value = '';
                    if (files.length) sendFiles(files, text.trim() && !editing ? text.trim() : '');
                    if (files.length && !editing) setText('');
                  }} />
                {!editing && <button className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="Attach a file"><Icon name="clip" /></button>}
                <textarea
                  ref={inputRef} rows={1} placeholder="Message…" aria-label="Message" value={text} maxLength={2000}
                  onChange={(e) => { setText(e.target.value); chat.notifyTyping(!!e.target.value); }}
                  onKeyDown={(e) => {
                    // Enter sends; Shift+Enter is a new line.
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                />
                {text.trim() || editing ? (
                  <button className="icon-btn" style={{ background: 'var(--accent)' }} onClick={submit} aria-label={editing ? 'Save edit' : 'Send'}><Icon name="send" size={18} /></button>
                ) : (
                  <button className="icon-btn" onClick={voice.start} aria-label="Record a voice message"><Icon name="mic" /></button>
                )}
              </div>
            )}
          </div>
        )}
      </footer>

      {a && (
        <Modal title="Message" onClose={() => setActing(null)}>
          {!a.deleted_at && !a.id.startsWith('temp-') && (
            <div className="row wrap" style={{ marginBottom: 8 }}>
              {QUICK_REACTIONS.map((e) => {
                const mineReaction = a.reactions?.find((r) => r.user_id === myId)?.emoji;
                return (
                  <button key={e} className="chip" aria-pressed={mineReaction === e} style={{ fontSize: 20 }}
                    onClick={() => { chat.react(a, mineReaction === e ? null : e); setActing(null); }}>{e}</button>
                );
              })}
            </div>
          )}
          <div className="menu">
            {!a.deleted_at && <button onClick={() => { setEditing(null); setReplyTo(a); setActing(null); inputRef.current?.focus(); }}>Reply</button>}
            {!a.deleted_at && a.content && (
              <button onClick={() => {
                navigator.clipboard.writeText(a.content).catch(() => showAlert('Could not copy'));
                setActing(null);
              }}>Copy</button>
            )}
            {canEdit(a, myId) && <button onClick={() => { setReplyTo(null); setEditing(a); setText(a.content); setActing(null); inputRef.current?.focus(); }}>Edit</button>}
            {!a.deleted_at && !a.id.startsWith('temp-') && <button onClick={() => { setForwarding(a); setActing(null); }}>Forward</button>}
            {!a.id.startsWith('temp-') && <button onClick={() => { chat.deleteForMe(a); setActing(null); }}>Delete for me</button>}
            {canDeleteForEveryone(a, myId) && (
              <button className="danger-text" onClick={() => { chat.deleteForEveryone(a); setActing(null); }}>Delete for everyone</button>
            )}
            {a.sender_id !== myId && !a.deleted_at && (
              <button className="danger-text" onClick={() => { setActing(null); askReportReason('message', a.id); }}>Report</button>
            )}
          </div>
        </Modal>
      )}

      {forwarding && (
        <ForwardModal myMatchId={matchId} isBrand={isBrand} onClose={() => setForwarding(null)}
          onForward={(ids) => { chat.forward(forwarding, ids); setForwarding(null); }} />
      )}

      {menu === 'main' && (
        <Modal title={other.name} onClose={() => setMenu(null)}>
          <div className="menu">
            <button onClick={() => { setMenu(null); router.push(profileHref); }}>View profile</button>
            {!isBrand && <button onClick={() => setMenu('rate')}>Rate {other.name}</button>}
            {muted ? <button onClick={() => setMute(null)}>Unmute notifications</button> : <button onClick={() => setMenu('mute')}>Mute notifications</button>}
            <button onClick={confirmClear}>Clear chat</button>
            <button className="danger-text" onClick={() => { setMenu(null); askReportReason('user', other.userId); }}>Report {other.name}</button>
            <button className="danger-text" onClick={() => { setMenu(null); confirmBlock(other.userId, other.name, () => router.replace('/app/messages')); }}>Block {other.name}</button>
          </div>
        </Modal>
      )}
      {menu === 'mute' && (
        <Modal title="Mute notifications" onClose={() => setMenu(null)}>
          <div className="menu">
            <button onClick={() => setMute('8h')}>8 hours</button>
            <button onClick={() => setMute('1w')}>1 week</button>
            <button onClick={() => setMute('always')}>Always</button>
          </div>
        </Modal>
      )}
      {menu === 'rate' && (
        <Modal title={`Rate ${other.name}`} onClose={() => setMenu(null)}>
          <BrandRating brandId={other.userId} />
        </Modal>
      )}
    </div>
  );
}
