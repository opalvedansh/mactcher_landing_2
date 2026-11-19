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

// The app's feed count format: 980, 1.2k, 12k, 1.5M.
const fmtCount = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

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

  const category = post.author_categories?.[0];
  const when = timeAgo(post.created_at);

  // Laid out like the app's feed card (mymatcher home.tsx HomePostCard): the
  // author over a dark fade at the top, actions on a frosted bar at the bottom.
  return (
    <article className="post">
      <div className="post__media">
        <img className="post__img" src={post.image_url} alt={post.caption || `${author}'s post`} onDoubleClick={() => !post.liked_by_me && toggleLike()} />
        <div className="post__head">
          <Link href={mine ? '/app/profile' : `/app/profile/${post.user_id}`} className="post__author">
            <Avatar src={post.author_avatar} name={author} size={44} />
            <span className="post__who">
              <b className="post__name"><span className="ellipsis">{author}</span>{post.author_verified && <Verified size={16} />}</b>
              <span className="post__meta ellipsis">{category ? `${category}, ${when}` : when}</span>
            </span>
          </Link>
          <button className="post__more" onClick={menu} aria-label={mine ? 'Post options' : 'Report or block'}><Icon name="more" width={3} /></button>
        </div>
        <div className="post__bar">
          <button onClick={toggleLike} aria-pressed={!!post.liked_by_me} aria-label={post.liked_by_me ? 'Unlike' : 'Like'}>
            <span key={String(!!post.liked_by_me)} className={post.liked_by_me ? 'post__heart post__heart--on' : 'post__heart'}><Icon name="heart" size={24} filled={!!post.liked_by_me} /></span>
            {post.likes_count > 0 && fmtCount(post.likes_count)}
          </button>
          <button onClick={() => setComments(true)} aria-label={`Comments, ${post.comments_count ?? 0}`}>
            <Icon name="comment" size={23} />{!!post.comments_count && fmtCount(post.comments_count)}
          </button>
          <button onClick={share} aria-label="Share">
            <Icon name="send" size={23} />{!!post.shares_count && fmtCount(post.shares_count)}
          </button>
        </div>
      </div>
      {post.caption && <p className="post__caption"><b>{author}</b> {post.caption}</p>}
      {comments && (
        <CommentsModal postId={post.id} postAuthorId={post.user_id} onClose={() => setComments(false)}
          onCountChange={(d) => setPost((p) => ({ ...p, comments_count: Math.max(0, (p.comments_count ?? 0) + d) }))} />
      )}
    </article>
  );
}
