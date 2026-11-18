'use client';

// New post (mymatcher app/create-post.tsx): one photo, cropped to 1:1, 4:5 or
// 16:9, with an optional caption.
import { useEffect, useState } from 'react';
import { Icon } from '@/components/portal/icons';
import { useRouter } from 'next/navigation';
import { createPost, uploadImage } from '@/lib/matchr/api';
import { cropToAspect, IMAGE_ACCEPT, pickFile } from '@/lib/matchr/image';
import { showAlert } from '@/components/portal/dialogs';
import { Spinner, errorText } from '@/components/portal/ui';

const ASPECTS = [
  { label: '1:1', ratio: 1 },
  { label: '4:5', ratio: 4 / 5 },
  { label: '16:9', ratio: 16 / 9 },
];
const MAX_CAPTION = 500;

export default function CreatePostPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [aspect, setAspect] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  // Re-crop whenever the photo or the aspect changes.
  useEffect(() => {
    if (!file) return;
    let url: string | null = null;
    cropToAspect(file, ASPECTS[aspect].ratio)
      .then((u) => { url = u; setPreview(u); })
      .catch(() => showAlert('Could not read that image', 'Try a JPG or PNG.'));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file, aspect]);

  const pick = async () => {
    const f = await pickFile(IMAGE_ACCEPT);
    if (f) setFile(f);
  };

  const share = async () => {
    if (!preview || posting) return;
    setPosting(true);
    try {
      const blob = await fetch(preview).then((r) => r.blob());
      const url = await uploadImage(blob);
      await createPost(url, caption.trim() || undefined);
      router.push('/app/home');
    } catch (err) {
      showAlert('Post not shared', errorText(err));
      setPosting(false);
    }
  };

  return (
    <div className="page">
      <div className="page__head">
        <button className="icon-btn" onClick={() => router.back()} aria-label="Back"><Icon name="back" /></button>
        <h1 className="page__title grow">New post</h1>
        <button className="btn btn--primary" disabled={!preview || posting} onClick={share}>{posting ? <Spinner small /> : 'Share'}</button>
      </div>
      <div className="stack">
        {preview ? (
          <>
            <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: 16, aspectRatio: String(ASPECTS[aspect].ratio), objectFit: 'cover' }} />
            <div className="row wrap">
              {ASPECTS.map((a, i) => (
                <button key={a.label} className="chip" aria-pressed={aspect === i} onClick={() => setAspect(i)}>{a.label}</button>
              ))}
              <button className="btn btn--ghost btn--sm" onClick={pick}>Change photo</button>
            </div>
          </>
        ) : (
          <button className="photo-slot" style={{ aspectRatio: '1', width: '100%' }} onClick={pick}>
            <span className="stack" style={{ alignItems: 'center' }}><Icon name="image" size={36} width={1.6} />Choose a photo</span>
          </button>
        )}
        <label className="field"><span>Caption</span>
          <textarea className="textarea" placeholder="Say what this is, and who it was for." maxLength={MAX_CAPTION} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <p className="small muted" style={{ textAlign: 'right' }}>{caption.length}/{MAX_CAPTION}</p>
      </div>
    </div>
  );
}
