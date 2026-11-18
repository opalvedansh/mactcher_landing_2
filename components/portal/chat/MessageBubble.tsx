'use client';

// One chat message (web version of mymatcher features/chat/MessageBubble.tsx).
import { memo } from 'react';
import type { ChatMessage } from '@/lib/matchr/types';
import type { SendState } from '@/lib/matchr/chat/useConversation';
import { describeMessage, fileTypeLabel, formatBytes, formatClock, formatDuration } from '@/lib/matchr/chat/format';
import { Icon } from '../icons';

function ticks(m: ChatMessage, send?: SendState) {
  if (send?.status === 'failed') return '!';
  if (m.id.startsWith('temp-')) return <Icon name="clock" size={13} />;
  if (m.read_at) return <span style={{ color: '#7cc4ff' }}><Icon name="checks" size={15} /></span>;
  if (m.delivered_at) return <Icon name="checks" size={15} />;
  return <Icon name="check" size={13} />;
}

function Attachment({ m }: { m: ChatMessage }) {
  const a = m.attachment;
  if (!a) return null;
  const src = a.local_uri ?? a.url ?? undefined;
  switch (m.kind) {
    case 'image':
      return src ? <a href={src} target="_blank" rel="noreferrer"><img className="bubble__media" src={src} alt={m.content || 'Photo'} /></a> : <span className="row" style={{ gap: 6 }}><Icon name="image" size={16} /> Photo</span>;
    case 'video':
      return src ? <video className="bubble__media" src={src} controls preload="metadata" /> : <span className="row" style={{ gap: 6 }}><Icon name="video" size={16} /> Video</span>;
    case 'audio':
      return src ? (
        <div className="stack" style={{ gap: 4 }}>
          <audio src={src} controls preload="metadata" style={{ maxWidth: 260 }} />
          {a.duration_ms ? <span className="small" style={{ opacity: 0.75 }}><Icon name="mic" size={12} /> {formatDuration(a.duration_ms)}</span> : null}
        </div>
      ) : <span className="row" style={{ gap: 6 }}><Icon name="mic" size={16} /> Voice message</span>;
    case 'document':
      return (
        <a className="row" href={src} target="_blank" rel="noreferrer" download={a.name} style={{ textDecoration: 'underline' }}>
          <Icon name="file" size={16} /> <span className="ellipsis">{a.name || 'Document'}</span>
          <span className="small" style={{ opacity: 0.75 }}>{[fileTypeLabel(a.name, a.mime), formatBytes(a.size)].filter(Boolean).join(' · ')}</span>
        </a>
      );
    default:
      return null;
  }
}

export const MessageBubble = memo(function MessageBubble({ m, mine, send, onOpenActions, onRetry, onDiscard }: {
  m: ChatMessage;
  mine: boolean;
  send?: SendState;
  onOpenActions: (m: ChatMessage) => void;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}) {
  const deleted = !!m.deleted_at;
  const clientId = m.client_msg_id ?? m.id.replace(/^temp-/, '');
  const grouped = new Map<string, number>();
  for (const r of m.reactions ?? []) grouped.set(r.emoji, (grouped.get(r.emoji) ?? 0) + 1);

  return (
    <div className={mine ? 'bubble-row bubble-row--mine' : 'bubble-row'}>
      <div
        className={deleted ? 'bubble bubble--deleted' : 'bubble'}
        role="button" tabIndex={0} aria-label="Message options"
        onClick={(e) => {
          // Links, players and downloads inside the bubble act on their own.
          if ((e.target as HTMLElement).closest('a,audio,video')) return;
          onOpenActions(m);
        }}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenActions(m)}
      >
        {deleted ? (mine ? 'You deleted this message' : 'This message was deleted') : (
          <>
            {m.forwarded && <div className="small" style={{ opacity: 0.7 }}><Icon name="forward" size={12} /> Forwarded</div>}
            {m.reply_to && (
              <div className="bubble__reply">
                {m.reply_to.deleted ? 'Deleted message' : describeMessage(m.reply_to.kind, m.reply_to.text, { name: m.reply_to.name, duration_ms: m.reply_to.duration_ms })}
              </div>
            )}
            <Attachment m={m} />
            {m.content && <div style={m.attachment ? { marginTop: 6 } : undefined}>{m.content}</div>}
          </>
        )}
        <div className="bubble__meta">
          {m.edited_at && !deleted ? 'edited · ' : ''}{formatClock(m.created_at)}{mine && !deleted && <> {ticks(m, send)}</>}
        </div>
        {send?.status === 'uploading' && <div className="small">Uploading {Math.round((send.progress ?? 0) * 100)}%</div>}
      </div>
      {grouped.size > 0 && (
        <span className="bubble__reactions">{[...grouped].map(([e, n]) => `${e}${n > 1 ? ` ${n}` : ''}`).join(' ')}</span>
      )}
      {send?.status === 'failed' && (
        <div className="row small" style={{ gap: 6 }}>
          <span className="danger-text">{send.error || 'Not sent'}</span>
          <button className="btn btn--ghost btn--sm" onClick={() => onRetry(clientId)}>Retry</button>
          <button className="btn btn--ghost btn--sm" onClick={() => onDiscard(clientId)}>Delete</button>
        </div>
      )}
    </div>
  );
});
