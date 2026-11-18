'use client';

// A single shared post (mymatcher app/p/[id].tsx). A signed-out visitor is
// sent to sign in and brought back here afterwards (see Providers).
import { useEffect, useState } from 'react';
import { Icon } from '@/components/portal/icons';
import { useParams, useRouter } from 'next/navigation';
import { getPost } from '@/lib/matchr/api';
import type { Post } from '@/lib/matchr/types';
import { PostCard } from '@/components/portal/posts/PostCard';
import { Spinner, useToast } from '@/components/portal/ui';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    getPost(id).then((r) => setPost(r.post)).catch((e) => setError(e?.status === 404 ? 'This post is no longer available.' : 'Could not load this post.'));
  }, [id]);

  return (
    <div className="page">
      <div className="page__head">
        <button className="icon-btn" onClick={() => (history.length > 1 ? router.back() : router.push('/app/home'))} aria-label="Back"><Icon name="back" /></button>
        <h1 className="page__title grow">Post</h1>
      </div>
      {error ? <p className="empty">{error}</p> : !post ? <Spinner /> : (
        <PostCard post={post} toast={toast.show} onGone={() => router.replace('/app/home')} />
      )}
      {toast.node}
    </div>
  );
}
