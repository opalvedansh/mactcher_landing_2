'use client';

// A post in the feed or on its own page: like (queued, see likeSync), comments,
// share, and the report/block or delete menu.
import { useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/matchr/types';
import { deletePost } from '@/lib/matchr/api';
import { useAuth } from '@/lib/matchr/auth';
import { syncLike } from '@/lib/matchr/utils/likeSync';
import { sharePost } from '@/lib/matchr/utils/postShare';
import { timeAgo } from '@/lib/matchr/utils/relativeTime';
import { openSafetyMenu } from '@/lib/matchr/safetyMenu';
import { showAlert } from '../dialogs';
import { Avatar } from '../ui';
import { CommentsModal } from './Comments';
import { Icon, Verified } from '../icons';

export function PostCard({ post: initial, onGone, toast }: { post: Post; onGone?: (id: string) => void; toast?: (t: string) => void }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initial);
  const [comments, setComments] = useState(false);
  const mine = post.user_id === user?.id;
  const author = post.author_name || 'Someone';

  const toggleLike = () => {
    const serverLiked = !!post.liked_by_me;
    const liked = !serverLiked;
    setPost((p) => ({ ...p, liked_by_me: liked, likes_count: p.likes_count + (liked ? 1 : -1) }));
    syncLike(post.id, serverLiked, liked, (actual) =>
      setPost((p) => (p.liked_by_me === actual ? p : { ...p, liked_by_me: actual, likes_count: p.likes_count + (actual ? 1 : -1) })));
  };

  const share = async () => {
    const count = await sharePost(post);
    if (count != null) setPost((p) => ({ ...p, shares_count: count }));
    if (!navigator.share) toast?.('Link copied');
  };

  const menu = () => mine
    ? showAlert('Your post', undefined, [
      {
        text: 'Delete post', style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post.id);
            onGone?.(post.id);
          } catch {
            showAlert('Could not delete', 'Please try again.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
    : openSafetyMenu({ userId: post.user_id, name: author, target: { type: 'post', id: post.id }, onBlocked: () => onGone?.(post.id) });

  return (
    <article className="post">
      <div className="post__head">
        <Link href={mine ? '/app/profile' : `/app/profile/${post.user_id}`} className="row grow">
          <Avatar src={post.author_avatar} name={author} size={36} />
          <div>
            <b>{author}{post.author_verified && <Verified size={14} />}</b>
            <div className="small muted">{timeAgo(post.created_at)}</div>
          </div>
        </Link>
        <button className="icon-btn" onClick={menu} aria-label="Post options"><Icon name="more" width={3} /></button>
      </div>
      <img className="post__img" src={post.image_url} alt={post.caption || `${author}'s post`} onDoubleClick={() => !post.liked_by_me && toggleLike()} />
      <div className="post__actions">
        <button className={post.liked_by_me ? 'liked' : undefined} onClick={toggleLike} aria-pressed={!!post.liked_by_me} aria-label="Like">
          <Icon name="heart" filled={!!post.liked_by_me} /> {post.likes_count}
        </button>
        <button onClick={() => setComments(true)} aria-label="Comments"><Icon name="comment" /> {post.comments_count ?? 0}</button>
        <button onClick={share} aria-label="Share"><Icon name="share" /> {post.shares_count ?? 0}</button>
      </div>
      {post.caption && <p className="post__body" style={{ whiteSpace: 'pre-wrap' }}><b>{author}</b> {post.caption}</p>}
      {comments && (
        <CommentsModal postId={post.id} postAuthorId={post.user_id} onClose={() => setComments(false)}
          onCountChange={(d) => setPost((p) => ({ ...p, comments_count: Math.max(0, (p.comments_count ?? 0) + d) }))} />
      )}
    </article>
  );
}
