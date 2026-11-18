import { recordPostShare } from '../api';
import type { Post } from '../types';

/**
 * The link points at the backend share page, which unfurls with the post
 * image and opens the app when it is installed.
 */
const SHARE_BASE = (
  process.env.NEXT_PUBLIC_SHARE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.mymatchr.in'
).replace(/\/$/, '');

export function postShareUrl(postId: string): string {
  return `${SHARE_BASE}/p/${postId}`;
}

/**
 * Opens the browser share sheet, or copies the link where there is none.
 * @returns the new share count when one came back, otherwise null.
 */
export async function sharePost(post: Pick<Post, 'id' | 'caption' | 'author_name'>): Promise<number | null> {
  const url = postShareUrl(post.id);
  const text = post.caption?.trim() || `See ${post.author_name || 'a creator'}'s post on Matchr`;
  try {
    if (navigator.share) {
      await navigator.share({ text, url });
      const { shares_count } = await recordPostShare(post.id, 'web');
      return shares_count;
    }
    await navigator.clipboard.writeText(url);
    const { shares_count } = await recordPostShare(post.id, 'link');
    return shares_count;
  } catch {
    // A cancelled share or a failed record is not worth interrupting anyone over.
    return null;
  }
}
