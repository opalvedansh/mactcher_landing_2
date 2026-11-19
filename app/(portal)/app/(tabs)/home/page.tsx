'use client';

// Home (mymatcher home.tsx, both roles): stories from your matches, then the
// ranked post feed. `?story=<userId>` opens that person's stories.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFeedStories, getPostFeed } from '@/lib/matchr/api';
import type { Post } from '@/lib/matchr/types';
import { PostCard } from '@/components/portal/posts/PostCard';
import { StoryViewer, type StoryGroup } from '@/components/portal/story/StoryViewer';
import { NotificationBell } from '@/components/portal/NotificationBell';
import { Avatar, Spinner, useToast } from '@/components/portal/ui';
import { Icon } from '@/components/portal/icons';
import { showAlert } from '@/components/portal/dialogs';

export default function HomePage() {
  const router = useRouter();
  const storyParam = useSearchParams().get('story');
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [viewing, setViewing] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const loadStories = useCallback((force = false) => {
    getFeedStories(force).then((s) => setStories((s as StoryGroup[]) ?? [])).catch(() => {});
  }, []);

  const loadFeed = useCallback(async () => {
    setError(false);
    try {
      const res = await getPostFeed(20);
      setPosts(res.posts);
      setCursor(res.next_cursor);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { loadStories(); loadFeed(); }, [loadStories, loadFeed]);

  // A story mention notification opens that person's stories.
  useEffect(() => {
    if (!storyParam || !stories.length) return;
    const i = stories.findIndex((g) => g.id === storyParam && g.items.length);
    if (i >= 0) setViewing(i);
  }, [storyParam, stories]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getPostFeed(20, cursor);
      setPosts((p) => {
        const seen = new Set((p ?? []).map((x) => x.id));
        return [...(p ?? []), ...res.posts.filter((x) => !seen.has(x.id))];
      });
      setCursor(res.next_cursor);
    } catch {
      /* the next scroll retries */
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(), { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const me = stories.find((g) => g.isMe);
  const viewable = stories.filter((g) => g.items.length);
  const ringClass = (g?: StoryGroup) =>
    !g?.items.length ? 'ring ring--empty' : g.items.some((s) => s.close_friends) ? 'ring ring--cf' : 'ring';

  // Your own bubble opens the app's "Create" menu rather than going straight to one place.
  const openMine = () => showAlert('Create', undefined, [
    ...(me?.items.length ? [{ text: 'View your story', onPress: () => setViewing(viewable.indexOf(me)) }] : []),
    { text: 'Add to story', onPress: () => router.push('/app/stories/new') },
    { text: 'Create post', onPress: () => router.push('/app/create-post') },
    { text: 'Cancel', style: 'cancel' as const },
  ]);

  return (
    <div className="page page--home">
      {/* The app's home has no title bar; on phones the stories row comes first. */}
      <div className="page__head home-head">
        <h1 className="page__title">Home</h1>
        <div className="row">
          <Link href="/app/create-post" className="icon-btn" aria-label="New post"><Icon name="plus" /></Link>
          <NotificationBell />
        </div>
      </div>

      <div className="stories-row" role="list" aria-label="Stories">
        <button className="story-ring" role="listitem" onClick={openMine} aria-label="Your story, create">
          <span className={ringClass(me)}><Avatar src={me?.avatar} name="You" size={70} /></span>
          <span className="story-ring__add" aria-hidden="true"><Icon name="plus" size={12} width={3} /></span>
          <span className="story-ring__name story-ring__name--me">Your story</span>
        </button>
        {viewable.filter((g) => !g.isMe).map((g) => (
          <button key={g.id} className="story-ring" role="listitem" onClick={() => setViewing(viewable.indexOf(g))} aria-label={`${g.name}'s story`}>
            <span className={ringClass(g)}><Avatar src={g.avatar} name={g.name} size={70} /></span>
            <span className="story-ring__name ellipsis">{g.name}</span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="empty"><p>Couldn&apos;t load the feed.</p><button className="btn btn--outline" onClick={loadFeed}>Try again</button></div>
      ) : !posts ? <div className="center" style={{ minHeight: 300 }}><Spinner /></div> : posts.length === 0 ? (
        <div className="empty stack" style={{ alignItems: 'center' }}>
          <p>No posts yet.</p>
          <Link href="/app/create-post" className="btn btn--primary">Share your first post</Link>
        </div>
      ) : (
        <div className="feed">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} toast={toast.show} onGone={(id) => setPosts((ps) => ps?.filter((x) => x.id !== id) ?? ps)} />
          ))}
          <div ref={sentinel} />
          {loadingMore && <Spinner />}
        </div>
      )}

      {viewing !== null && viewing >= 0 && (
        <StoryViewer groups={viewable} startIndex={viewing} onClose={() => { setViewing(null); loadStories(true); if (storyParam) router.replace('/app/home'); }} />
      )}
      {toast.node}
    </div>
  );
}
