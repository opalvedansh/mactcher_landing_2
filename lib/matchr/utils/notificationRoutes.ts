import type { NotificationType } from '../types';

/** Where a notification opens in the portal. One set of routes serves both roles. */
export function notificationHref(
  type: NotificationType | undefined,
  matchId?: string | null,
  /** For a story mention: whose stories to open. */
  authorId?: string | null,
): string {
  if (type === 'story_mention' && authorId) return `/app/home?story=${encodeURIComponent(authorId)}`;
  if (type === 'new_like') return '/app/likes';
  if (type === 'new_message' && matchId) return `/app/messages/${encodeURIComponent(matchId)}`;
  return '/app/messages';
}
