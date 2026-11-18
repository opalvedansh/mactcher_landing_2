'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMatchById } from '@/lib/matchr/api';
import { useAuth } from '@/lib/matchr/auth';
import type { MatchRecord } from '@/lib/matchr/types';
import { Conversation } from '@/components/portal/chat/Conversation';
import { Spinner } from '@/components/portal/ui';

export default function ConversationPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user, onboardingData } = useAuth();
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMatch(null);
    setError(null);
    getMatchById(matchId)
      .then(setMatch)
      .catch((e) => setError(e?.status === 404 || e?.status === 403 ? 'This chat is no longer available.' : 'Could not open this chat.'));
  }, [matchId]);

  if (error) return <div className="center muted">{error}</div>;
  if (!match || !user) return <Spinner screen />;
  // Keyed so switching chats starts a fresh conversation state.
  return <Conversation key={match.match_id} match={match} myId={user.id} isBrand={onboardingData?.role === 'Brand'} />;
}
