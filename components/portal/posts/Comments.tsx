'use client';

// Comments on a post (mymatcher src/components/CommentsSheet.tsx): newest page
// first, replies on demand, like, reply, and delete (yours, or any on your post).
import { useCallback, useEffect, useState } from 'react';
import {
  createPostComment, deletePostComment, getCommentReplies, getPostComments, likePostComment, type PostComment,
} from '@/lib/matchr/api';
import { useAuth } from '@/lib/matchr/auth';
import { timeAgo } from '@/lib/matchr/utils/relativeTime';
import { showAlert } from '../dialogs';
import { Avatar, Modal, Spinner, errorText } from '../ui';
import { Icon, Verified } from '../icons';

const PAGE = 20;

export function CommentsModal({ postId, postAuthorId, onClose, onCountChange }: {
  postId: string; postAuthorId: string; onClose: () => void; onCountChange?: (delta: number) => void;
}) {
  const { user } = useAuth();
  const me = user?.id;
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, PostComment[]>>({});
  const [error, setError] = useState(false);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await getPostComments(postId, PAGE);
      setComments(res.comments);
      setNextBefore(res.next_before);
    } catch {
      setError(true);
    }
  }, [postId]);
  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    if (!nextBefore) return;
    const res = await getPostComments(postId, PAGE, nextBefore).catch(() => null);
    if (!res) return;
    setComments((c) => [...(c ?? []), ...res.comments]);
    setNextBefore(res.next_before);
  };

  const loadReplies = async (c: PostComment) => {
    const res = await getCommentReplies(postId, c.id, PAGE).catch(() => null);
    if (res) setReplies((r) => ({ ...r, [c.id]: res.replies }));
  };

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const parent = replyTo?.parent_id ? (comments ?? []).find((c) => c.id === replyTo.parent_id) ?? replyTo : replyTo;
      const { comment } = await createPostComment(postId, text, parent?.id);
      if (parent) {
        setReplies((r) => ({ ...r, [parent.id]: [...(r[parent.id] ?? []), comment] }));
        setComments((cs) => cs?.map((c) => (c.id === parent.id ? { ...c, replies_count: c.replies_count + 1 } : c)) ?? cs);
      } else {
        setComments((cs) => [comment, ...(cs ?? [])]);
      }
      onCountChange?.(1);
      setBody('');
      setReplyTo(null);
    } catch (e) {
      showAlert('Could not post that', errorText(e));
    } finally {
      setSending(false);
    }
  };

  const update = (id: string, change: (c: PostComment) => PostComment) => {
    setComments((cs) => cs?.map((c) => (c.id === id ? change(c) : c)) ?? cs);
    setReplies((r) => Object.fromEntries(Object.entries(r).map(([k, list]) => [k, list.map((c) => (c.id === id ? change(c) : c))])));
  };

  const like = async (c: PostComment) => {
    const liked = !c.liked_by_me;
    update(c.id, (x) => ({ ...x, liked_by_me: liked, likes_count: x.likes_count + (liked ? 1 : -1) }));
    try {
      const res = await likePostComment(postId, c.id, liked);
      update(c.id, (x) => ({ ...x, liked_by_me: res.liked, likes_count: res.likes_count }));
    } catch {
      update(c.id, (x) => ({ ...x, liked_by_me: c.liked_by_me, likes_count: c.likes_count }));
    }
  };

  const remove = (c: PostComment) => showAlert('Delete this comment?', undefined, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete', style: 'destructive',
      onPress: async () => {
        try {
          await deletePostComment(postId, c.id);
          setComments((cs) => cs?.filter((x) => x.id !== c.id) ?? cs);
          setReplies((r) => Object.fromEntries(Object.entries(r).map(([k, list]) => [k, list.filter((x) => x.id !== c.id)])));
          onCountChange?.(-1 - (c.parent_id ? 0 : c.replies_count));
        } catch {
          showAlert('Could not delete', 'Please try again.');
        }
      },
    },
  ]);

  const Row = ({ c, reply }: { c: PostComment; reply?: boolean }) => (
    <div className="row" style={{ alignItems: 'flex-start', paddingLeft: reply ? 44 : 0 }}>
      <Avatar src={c.author_avatar} name={c.author_name} size={reply ? 28 : 36} />
      <div className="grow stack" style={{ gap: 4 }}>
        <p><b>{c.author_name || 'Someone'}{c.author_verified && <Verified size={13} />}</b> <span className="small muted">{timeAgo(c.created_at)}</span></p>
        <p style={{ whiteSpace: 'pre-wrap' }}>{c.body}</p>
        <div className="row small muted" style={{ gap: 14 }}>
          <button className="btn--ghost" style={{ border: 0, background: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setReplyTo(c)}>Reply</button>
          {!!me && (c.user_id === me || postAuthorId === me) && (
            <button style={{ border: 0, background: 'none', cursor: 'pointer' }} className="danger-text" onClick={() => remove(c)}>Delete</button>
          )}
        </div>
        {!reply && c.replies_count > 0 && !replies[c.id] && (
          <button className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start', padding: 0 }} onClick={() => loadReplies(c)}>View {c.replies_count} {c.replies_count === 1 ? 'reply' : 'replies'}</button>
        )}
      </div>
      <button className={c.liked_by_me ? 'liked' : 'muted'} style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => like(c)} aria-label={c.liked_by_me ? 'Unlike comment' : 'Like comment'}>
        <Icon name="heart" size={16} filled={!!c.liked_by_me} />{c.likes_count > 0 && <div className="small">{c.likes_count}</div>}
      </button>
    </div>
  );

  return (
    <Modal title="Comments" onClose={onClose}>
      <div className="stack">
        {error ? <button className="btn btn--outline" onClick={load}>Try again</button> : !comments ? <Spinner /> : comments.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center' }}>No comments yet. Be the first to say something.</p>
        ) : comments.map((c) => (
          <div key={c.id} className="stack" style={{ gap: 10 }}>
            <Row c={c} />
            {(replies[c.id] ?? []).map((r) => <Row key={r.id} c={r} reply />)}
          </div>
        ))}
        {nextBefore && <button className="btn btn--ghost btn--sm" onClick={loadMore}>Load more</button>}
        <hr className="divider" />
        {replyTo && (
          <div className="row small muted">
            <span className="grow">Replying to {replyTo.author_name || 'comment'}</span>
            <button className="btn btn--ghost btn--sm" onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        )}
        <div className="composer">
          <textarea rows={1} maxLength={2200} placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'} aria-label="Comment" value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn btn--primary btn--sm" disabled={!body.trim() || sending} onClick={send}>{sending ? <Spinner small /> : 'Post'}</button>
        </div>
      </div>
    </Modal>
  );
}
