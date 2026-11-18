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

  return (
    <div className="page">
      <div className="page__head">
        <h1 className="page__title">Home</h1>
        <div className="row">
          <Link href="/app/create-post" className="icon-btn" aria-label="New post"><Icon name="plus" /></Link>
          <NotificationBell />
        </div>
      </div>

      <div className="stories-row" role="list" aria-label="Stories">
        <div className="story-ring" role="listitem">
          <button className="story-ring" style={{ width: 'auto' }} onClick={() => (me?.items.length ? setViewing(viewable.indexOf(me)) : router.push('/app/stories/new'))}
            aria-label={me?.items.length ? 'View your story' : 'Add to your story'}>
            <span className={me?.items.length ? 'ring' : 'ring ring--seen'}><Avatar src={me?.avatar} name="You" size={60} /></span>
            Your story
          </button>
          {!!me?.items.length && <Link href="/app/stories/new" className="small accent">+ Add</Link>}
        </div>
        {viewable.filter((g) => !g.isMe).map((g) => (
          <button key={g.id} className="story-ring" role="listitem" onClick={() => setViewing(viewable.indexOf(g))}>
            <span className="ring"><Avatar src={g.avatar} name={g.name} size={60} /></span>
            <span className="ellipsis" style={{ maxWidth: 72 }}>{g.name}</span>
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
        <div className="stack" style={{ gap: 20 }}>
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
