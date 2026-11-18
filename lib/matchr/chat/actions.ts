// Copied from mymatcher src/features/chat/MessageActions.tsx.
import type { ChatMessage } from '../types';

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];

// Same windows as the server (services/chat.js); it has the final say.
export const EDIT_WINDOW_MS = 15 * 60 * 1000;
export const DELETE_FOR_EVERYONE_WINDOW_MS = 48 * 60 * 60 * 1000;

const age = (m: ChatMessage) => Date.now() - new Date(m.created_at).getTime();

export function canEdit(m: ChatMessage, myId?: string) {
  return m.sender_id === myId && !m.deleted_at && !m.id.startsWith('temp-')
    && (m.kind ?? 'text') !== 'audio' && age(m) < EDIT_WINDOW_MS;
}

export function canDeleteForEveryone(m: ChatMessage, myId?: string) {
  return m.sender_id === myId && !m.deleted_at && !m.id.startsWith('temp-') && age(m) < DELETE_FOR_EVERYONE_WINDOW_MS;
}

const MB = 1024 * 1024;
/** Per-kind upload caps, the same as the server's (utils/chatStorage.js). */
export const MAX_BYTES = { image: 16 * MB, video: 50 * MB, audio: 16 * MB, document: 50 * MB } as const;
