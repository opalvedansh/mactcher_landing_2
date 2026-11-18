'use client';

// New story on the web (mymatcher story-camera.tsx + StoryEditor.tsx): a photo,
// video or text-only story with text, a filter and a song, shared with
// everyone or Close Friends. Saves the same layout JSON the apps read.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStoryAudience, searchStoryMusic, setCloseFriends, uploadImage, uploadStory, uploadStoryVideo, type StoryAudienceMember,
} from '@/lib/matchr/api';
import {
  CANVAS_H, CANVAS_W, FILTERS, FILTER_ORDER, FONTS, FONT_ORDER, GRADIENTS, PALETTE, fitPhoto, newId,
  type FilterId, type Layer, type Placement, type StoryLayout, type TextBg, type TextLayer, type Track,
} from '@/lib/matchr/story';
import { LayerContent, StoryCanvas, placed, useCanvasScale } from '@/components/portal/story/StoryCanvas';
import { showAlert } from '@/components/portal/dialogs';
import { Avatar, Modal, Spinner } from '@/components/portal/ui';
import { Icon } from '@/components/portal/icons';

const VIDEO_BG: [string, string] = ['#232526', '#0F0F0F'];
const MAX_VIDEO_MS = 60_000;
const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime';
const DEFAULT_TEXT: Omit<TextLayer, 'id' | 'text'> = {
  type: 'text', font: 'classic', color: '#FFFFFF', bg: 'none', align: 'center', size: 76,
  x: CANVAS_W / 2, y: CANVAS_H / 2, scale: 1, rotation: 0,
};
const BGS: TextBg[] = ['none', 'solid', 'soft'];

type Draft = { file: File; uri: string; video: boolean; width: number; height: number; durationMs: number | null };

/** Rounds positions so the saved JSON stays small, like the app's compact(). */
function compact(l: StoryLayout): StoryLayout {
  const r = (n: number) => Math.round(n * 100) / 100;
  const place = <T extends Placement>(p: T): T => ({ ...p, x: r(p.x), y: r(p.y), scale: r(p.scale), rotation: r(p.rotation) });
  return { ...l, photo: l.photo ? { ...place(l.photo), w: r(l.photo.w), h: r(l.photo.h) } : null, layers: l.layers.map(place) };
}

async function readDraft(file: File): Promise<Draft> {
  const uri = URL.createObjectURL(file);
  if (file.type.startsWith('video/')) {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.src = uri;
    await new Promise((ok, fail) => { v.onloadedmetadata = ok; v.onerror = fail; });
    return { file, uri, video: true, width: v.videoWidth || 720, height: v.videoHeight || 1280, durationMs: Math.round(v.duration * 1000) };
  }
  const bmp = await createImageBitmap(file);
  const d = { file, uri, video: false, width: bmp.width, height: bmp.height, durationMs: null };
  bmp.close();
  return d;
}

function MusicPicker({ onPick, onClose }: { onPick: (t: Track) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => searchStoryMusic(q.trim()).then(setTracks).catch(() => setTracks([])), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => () => audio.current?.pause(), []);
  const preview = (url: string) => {
    audio.current?.pause();
    audio.current = new Audio(url);
    audio.current.play().catch(() => {});
  };
  return (
    <Modal title="Add music" onClose={onClose}>
      <div className="stack">
        <input className="input" type="search" placeholder="Search songs" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        {!tracks ? <Spinner /> : tracks.length === 0 ? <p className="muted">No songs found.</p> : (
          <div className="list">
            {tracks.map((t) => (
              <div key={t.id} className="list-item">
                {t.artwork ? <img src={t.artwork} alt="" width={44} height={44} style={{ borderRadius: 6 }} /> : <Icon name="music" />}
                <div className="grow"><b className="ellipsis" style={{ display: 'block' }}>{t.title}</b><span className="small muted">{t.artist}</span></div>
                <button className="icon-btn" aria-label={`Preview ${t.title}`} onClick={() => preview(t.preview)}><Icon name="play" size={14} filled /></button>
                <button className="btn btn--primary btn--sm" onClick={() => onPick(t)}>Use</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function CloseFriendsModal({ onClose }: { onClose: () => void }) {
  const [people, setPeople] = useState<StoryAudienceMember[] | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getStoryAudience().then((p) => { setPeople(p); setIds(p.filter((x) => x.close_friend).map((x) => x.id)); }).catch(() => setPeople([]));
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      await setCloseFriends(ids);
      onClose();
    } catch {
      showAlert('Could not save your list', 'Please try again.');
      setSaving(false);
    }
  };
  return (
    <Modal title="Close Friends" onClose={onClose}>
      {!people ? <Spinner /> : people.length === 0 ? <p className="muted">Your matches show up here.</p> : (
        <div className="stack">
          <div className="list">
            {people.map((p) => {
              const on = ids.includes(p.id);
              return (
                <label key={p.id} className="list-item" style={{ cursor: 'pointer' }}>
                  <Avatar src={p.avatar} name={p.name} size={36} />
                  <span className="grow">{p.name}</span>
                  <input type="checkbox" checked={on} onChange={() => setIds(on ? ids.filter((x) => x !== p.id) : [...ids, p.id])} />
                </label>
              );
            })}
          </div>
          <button className="btn btn--primary" disabled={saving} onClick={save}>{saving ? <Spinner small /> : 'Save'}</button>
        </div>
      )}
    </Modal>
  );
}

export default function NewStoryPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [layout, setLayout] = useState<StoryLayout>({ v: 1, bg: { kind: 'gradient', colors: GRADIENTS[0] }, photo: null, strokes: [], layers: [], music: null, videoMuted: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | 'music' | 'friends'>(null);
  const [posting, setPosting] = useState<false | 'all' | 'close_friends'>(false);
  const { ref: stageRef, k } = useCanvasScale();
  const drag = useRef<{ id: string; x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => () => { if (draft) URL.revokeObjectURL(draft.uri); }, [draft]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const d = await readDraft(file);
      if (d.video && (d.durationMs ?? 0) > MAX_VIDEO_MS) {
        showAlert('Video too long', 'Stories can be up to 60 seconds. Trim it and try again.');
        return;
      }
      setDraft(d);
      setLayout((l) => ({
        ...l,
        bg: d.video ? { kind: 'gradient', colors: VIDEO_BG } : { kind: 'blur' },
        photo: fitPhoto(d.width, d.height, d.video ? 'contain' : 'cover'),
      }));
    } catch {
      showAlert('Could not open that file', 'Try a JPG, PNG, MP4 or MOV.');
    }
  };

  const updateLayer = (id: string, change: Partial<Layer>) =>
    setLayout((l) => ({ ...l, layers: l.layers.map((x) => (x.id === id ? ({ ...x, ...change } as Layer) : x)) }));

  const addText = () => {
    const id = newId();
    setLayout((l) => ({ ...l, layers: [...l.layers, { ...DEFAULT_TEXT, id, text: 'Tap to edit' }] }));
    setSelected(id);
  };

  const pickSong = (t: Track) => {
    const { duration_ms: _d, ...song } = t;
    void _d;
    setLayout((l) => ({
      ...l,
      music: { ...song, start: 0 },
      layers: [...l.layers.filter((x) => x.type !== 'music'),
        { id: newId(), type: 'music', text: '', style: 'card', size: 64, x: CANVAS_W / 2, y: CANVAS_H * 0.72, scale: 1, rotation: 0 }],
    }));
    setPanel(null);
  };

  const onPointerDown = (e: ReactPointerEvent, l: Layer) => {
    e.stopPropagation();
    setSelected(l.id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { id: l.id, x: l.x, y: l.y, px: e.clientX, py: e.clientY };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || !k) return;
    updateLayer(d.id, {
      x: Math.min(CANVAS_W, Math.max(0, d.x + (e.clientX - d.px) / k)),
      y: Math.min(CANVAS_H, Math.max(0, d.y + (e.clientY - d.py) / k)),
    });
  };

  const sel = layout.layers.find((l) => l.id === selected) ?? null;
  const isEmpty = !draft && !layout.layers.some((l) => l.type === 'text' && l.text.trim());

  const post = async (audience: 'all' | 'close_friends') => {
    if (posting || isEmpty) return;
    setPosting(audience);
    try {
      const mediaUrl = !draft ? null : draft.video ? await uploadStoryVideo(draft.file) : await uploadImage(draft.file);
      await uploadStory({
        media_url: mediaUrl,
        layout: compact({ ...layout, layers: layout.layers.filter((l) => l.type !== 'text' || l.text.trim()) }),
        media_type: draft?.video ? 'video' : 'image',
        duration_ms: draft?.video ? draft.durationMs : null,
        audience,
      });
      router.push('/app/home');
    } catch (err) {
      console.error('Failed to post story', err);
      showAlert('Story not posted', 'Something went wrong while uploading. Please try again.');
      setPosting(false);
    }
  };

  return (
    <main className="page" style={{ maxWidth: 1000 }}>
      <div className="page__head">
        <button className="icon-btn" onClick={() => router.back()} aria-label="Close"><Icon name="close" /></button>
        <h1 className="page__title grow">New story</h1>
      </div>
      <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="row wrap" style={{ alignItems: 'flex-start', gap: 24 }}>
        <div ref={stageRef} style={{ width: 'min(100%, 380px)', borderRadius: 16, overflow: 'hidden', position: 'relative', touchAction: 'none' }}
          onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }} onPointerDown={() => setSelected(null)}>
          <StoryCanvas layout={layout} mediaUri={draft?.uri ?? null} video={draft?.video} hideLayers>
            {layout.layers.map((l) => (
              <div key={l.id} style={{ ...placed(l), cursor: 'grab', outline: l.id === selected ? `${3 / (k || 1)}px dashed #fff` : undefined, outlineOffset: 8 }}
                onPointerDown={(e) => onPointerDown(e, l)} onClick={(e) => e.stopPropagation()}>
                <LayerContent layer={l} music={layout.music} />
              </div>
            ))}
          </StoryCanvas>
        </div>

        <div className="stack grow" style={{ minWidth: 260 }}>
          <div className="row wrap">
            <button className="btn btn--outline btn--sm" onClick={() => fileRef.current?.click()}>{draft ? 'Change photo/video' : 'Add photo or video'}</button>
            <button className="btn btn--outline btn--sm" onClick={addText}>Aa Text</button>
            {!draft && (
              <button className="btn btn--outline btn--sm" onClick={() => setLayout((l) => {
                // A text-only story cycles through the app's gradients.
                const i = l.bg.kind === 'gradient' ? GRADIENTS.findIndex((g) => g[0] === (l.bg as { colors: [string, string] }).colors[0]) : -1;
                return { ...l, bg: { kind: 'gradient', colors: GRADIENTS[(i + 1) % GRADIENTS.length] } };
              })}>Background colour</button>
            )}
            <button className="btn btn--outline btn--sm" onClick={() => setPanel('music')}><Icon name="music" size={16} /> {layout.music ? 'Change song' : 'Music'}</button>
            {layout.music && <button className="btn btn--ghost btn--sm" onClick={() => setLayout((l) => ({ ...l, music: null, layers: l.layers.filter((x) => x.type !== 'music') }))}>Remove song</button>}
            {draft?.video && !layout.music && (
              <button className="btn btn--ghost btn--sm" onClick={() => setLayout((l) => ({ ...l, videoMuted: !l.videoMuted }))}>{layout.videoMuted ? <><Icon name="mute" size={16} /> Sound off</> : <><Icon name="volume" size={16} /> Sound on</>}</button>
            )}
          </div>

          {draft && !draft.video && layout.photo && (
            <div className="field">
              <span>Filter</span>
              <div className="row wrap">
                {FILTER_ORDER.map((f: FilterId) => (
                  <button key={f} className="chip" aria-pressed={layout.photo!.filter === f}
                    onClick={() => setLayout((l) => ({ ...l, photo: l.photo ? { ...l.photo, filter: f } : l.photo }))}>{FILTERS[f].label}</button>
                ))}
              </div>
            </div>
          )}

          {sel && (
            <div className="card stack">
              {sel.type === 'text' && (
                <>
                  <textarea className="textarea" style={{ minHeight: 70 }} aria-label="Story text" value={sel.text} autoFocus
                    onChange={(e) => updateLayer(sel.id, { text: e.target.value })} />
                  <div className="row wrap">
                    {FONT_ORDER.map((f) => (
                      <button key={f} className="chip" aria-pressed={sel.font === f} style={{ fontFamily: FONTS[f].family }} onClick={() => updateLayer(sel.id, { font: f })}>{FONTS[f].label}</button>
                    ))}
                  </div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {PALETTE.map((c) => (
                      <button key={c} aria-label={`Colour ${c}`} onClick={() => updateLayer(sel.id, { color: c })}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: sel.color === c ? '3px solid var(--accent)' : '1px solid #555', cursor: 'pointer' }} />
                    ))}
                  </div>
                  <div className="row wrap">
                    <button className="btn btn--outline btn--sm" onClick={() => updateLayer(sel.id, { bg: BGS[(BGS.indexOf(sel.bg) + 1) % BGS.length] })}>Background: {sel.bg}</button>
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <button key={a} className="chip" aria-pressed={sel.align === a} onClick={() => updateLayer(sel.id, { align: a })}>{a}</button>
                    ))}
                  </div>
                </>
              )}
              <div className="row wrap">
                <button className="btn btn--outline btn--sm" onClick={() => updateLayer(sel.id, { scale: Math.max(0.3, sel.scale - 0.15) })}>Smaller</button>
                <button className="btn btn--outline btn--sm" onClick={() => updateLayer(sel.id, { scale: Math.min(4, sel.scale + 0.15) })}>Bigger</button>
                <button className="btn btn--outline btn--sm" onClick={() => updateLayer(sel.id, { rotation: sel.rotation - Math.PI / 24 })} aria-label="Rotate left"><Icon name="rotateLeft" size={16} /></button>
                <button className="btn btn--outline btn--sm" onClick={() => updateLayer(sel.id, { rotation: sel.rotation + Math.PI / 24 })} aria-label="Rotate right"><Icon name="rotateRight" size={16} /></button>
                <button className="btn btn--ghost btn--sm danger-text" onClick={() => {
                  setLayout((l) => ({ ...l, layers: l.layers.filter((x) => x.id !== sel.id), music: sel.type === 'music' ? null : l.music }));
                  setSelected(null);
                }}>Delete</button>
              </div>
            </div>
          )}
          <p className="small muted">Drag text and stickers on the story to move them.</p>

          <div className="row wrap" style={{ marginTop: 8 }}>
            <button className="btn btn--primary" disabled={isEmpty || !!posting} onClick={() => post('all')}>{posting === 'all' ? <Spinner small /> : 'Share to your story'}</button>
            <button className="btn btn--outline" disabled={isEmpty || !!posting} onClick={() => post('close_friends')}>{posting === 'close_friends' ? <Spinner small /> : 'Close Friends'}</button>
            <button className="btn btn--ghost btn--sm" onClick={() => setPanel('friends')}>Edit Close Friends</button>
          </div>
        </div>
      </div>
      {panel === 'music' && <MusicPicker onPick={pickSong} onClose={() => setPanel(null)} />}
      {panel === 'friends' && <CloseFriendsModal onClose={() => setPanel(null)} />}
    </main>
  );
}
