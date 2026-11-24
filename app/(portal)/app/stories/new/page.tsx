'use client';

// New story on the web (mymatcher story-camera.tsx + StoryEditor.tsx): a photo,
// video or text-only story with text, stickers, @mentions, drawing, a filter
// and a song, shared with everyone or Close Friends. Saves the same layout JSON
// the apps read.
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStoryAudience, searchStoryMusic, setCloseFriends, uploadImage, uploadStory, uploadStoryVideo, type StoryAudienceMember,
} from '@/lib/matchr/api';
import {
  BRUSHES, BRUSH_ORDER, CANVAS_H, CANVAS_W, EMOJI, FILTERS, FILTER_ORDER, FONTS, FONT_ORDER, GRADIENTS, MAX_CLIP_START, MUSIC_CLIP_SECONDS, PALETTE,
  arrowHead, clockNow, dateNow, fitPhoto, keepInClip, newId, pathFromPoints, strokeHit, strokeWidthFor,
  type BrushId, type FilterId, type Layer, type Placement, type Point, type StickerLayer, type StoryLayout, type Stroke, type TextBg, type TextLayer, type Track,
} from '@/lib/matchr/story';
import { LayerContent, StoryCanvas, placed, useCanvasScale } from '@/components/portal/story/StoryCanvas';
import { CameraModal } from '@/components/portal/story/CameraModal';
import { saveStory } from '@/components/portal/story/renderStory';
import { showAlert } from '@/components/portal/dialogs';
import { Avatar, Modal, Spinner } from '@/components/portal/ui';
import { Icon } from '@/components/portal/icons';

const VIDEO_BG: [string, string] = ['#232526', '#0F0F0F'];
const MAX_VIDEO_MS = 60_000;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // the app's cap; the server doesn't check story video size
const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime';
const DEFAULT_TEXT: Omit<TextLayer, 'id' | 'text'> = {
  type: 'text', font: 'classic', color: '#FFFFFF', bg: 'none', align: 'center', size: 76,
  x: CANVAS_W / 2, y: CANVAS_H / 2, scale: 1, rotation: 0,
};
const BGS: TextBg[] = ['none', 'solid', 'soft'];
const CENTRE = { x: CANVAS_W / 2, y: CANVAS_H / 2, scale: 1, rotation: 0 };

type Draft = { file: File; uri: string; video: boolean; width: number; height: number; durationMs: number | null };
type Panel = null | 'music' | 'friends' | 'friendsShare' | 'stickers' | 'mention' | 'camera';

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
    const durationMs = Number.isFinite(v.duration) ? Math.round(v.duration * 1000) : null;
    return { file, uri, video: true, width: v.videoWidth || 720, height: v.videoHeight || 1280, durationMs };
  }
  const bmp = await createImageBitmap(file);
  const d = { file, uri, video: false, width: bmp.width, height: bmp.height, durationMs: null };
  bmp.close();
  return d;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Swatches({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <div className="row wrap" style={{ gap: 6 }}>
      {PALETTE.map((c) => (
        <button key={c} aria-label={`Colour ${c}`} aria-pressed={value === c} onClick={() => onPick(c)}
          style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: value === c ? '3px solid var(--accent)' : '1px solid #555', cursor: 'pointer' }} />
      ))}
    </div>
  );
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
        <p className="small muted">Song previews from Apple Music</p>
      </div>
    </Modal>
  );
}

/** Your matches, filtered by name (Close Friends and @mentions pick from them). */
function useAudience() {
  const [people, setPeople] = useState<StoryAudienceMember[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { getStoryAudience().then(setPeople).catch(() => setPeople([])); }, []);
  const shown = people?.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())) ?? null;
  const search = <input className="input" type="search" placeholder="Search" aria-label="Search your matches" value={q} onChange={(e) => setQ(e.target.value)} />;
  return { people, shown, search };
}

function MentionModal({ onPick, onClose }: { onPick: (p: StoryAudienceMember) => void; onClose: () => void }) {
  const { people, shown, search } = useAudience();
  return (
    <Modal title="Mention" onClose={onClose}>
      {!people || !shown ? <Spinner /> : people.length === 0 ? <p className="muted">You can mention people you've matched with.</p> : (
        <div className="stack">
          {search}
          <div className="list">
            {shown.map((p) => (
              <button key={p.id} className="list-item" onClick={() => onPick(p)}
                style={{ width: '100%', background: 'none', border: 0, color: 'inherit', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
                <Avatar src={p.avatar} name={p.name} size={36} />
                <span className="grow">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function CloseFriendsModal({ onSaved, onClose }: { onSaved: (ids: string[]) => void; onClose: () => void }) {
  const { people, shown, search } = useAudience();
  const [ids, setIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (people) setIds(people.filter((x) => x.close_friend).map((x) => x.id)); }, [people]);
  const save = async () => {
    setSaving(true);
    try {
      await setCloseFriends(ids);
      onClose();
      onSaved(ids);
    } catch {
      showAlert('Could not save your list', 'Please try again.');
      setSaving(false);
    }
  };
  return (
    <Modal title="Close Friends" onClose={onClose}>
      {!people || !shown ? <Spinner /> : people.length === 0 ? <p className="muted">Your matches show up here.</p> : (
        <div className="stack">
          {search}
          <div className="list">
            {shown.map((p) => {
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

/** The sticker tray (the app's StickerSheet): music, mention, time, date, hashtag and location, then emoji. */
function StickerModal({ onSticker, onText, onMention, onMusic, onClose }: {
  onSticker: (kind: StickerLayer['kind'], text: string) => void;
  onText: (prefix: string) => void;
  onMention: () => void;
  onMusic: () => void;
  onClose: () => void;
}) {
  const specials: [string, () => void][] = [
    ['♪ MUSIC', onMusic],
    ['@MENTION', onMention],
    [clockNow(), () => onSticker('time', clockNow())],
    [dateNow(), () => onSticker('date', dateNow())],
    ['#HASHTAG', () => onText('#')],
    ['📍 LOCATION', () => onText('📍 ')],
  ];
  return (
    <Modal title="Stickers" onClose={onClose}>
      <div className="stack">
        <div className="row wrap">
          {specials.map(([label, onClick]) => <button key={label} className="chip" style={{ fontWeight: 800 }} onClick={onClick}>{label}</button>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}>
          {EMOJI.map((e, i) => (
            <button key={`${e}${i}`} className="icon-btn" aria-label={e} style={{ fontSize: 28, width: 44, height: 44 }} onClick={() => onSticker('emoji', e)}>{e}</button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default function NewStoryPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [layout, setLayout] = useState<StoryLayout>({ v: 1, bg: { kind: 'gradient', colors: GRADIENTS[0] }, photo: null, strokes: [], layers: [], music: null, videoMuted: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [posting, setPosting] = useState<false | 'all' | 'close_friends'>(false);
  const [saving, setSaving] = useState(false);
  const [closeFriends, setCloseFriendsCount] = useState<number | null>(null);
  const { ref: stageRef, k } = useCanvasScale();
  const drag = useRef<{ id: string; x: number; y: number; px: number; py: number } | null>(null);

  // Drawing
  const [drawing, setDrawing] = useState(false);
  const [brush, setBrush] = useState<BrushId | 'eraser'>('pen');
  const [drawColor, setDrawColor] = useState('#FFFFFF');
  const [drawSize, setDrawSize] = useState(0.2);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [live, setLive] = useState<Stroke | null>(null);
  const points = useRef<Point[]>([]);
  const eraseStart = useRef<Stroke[] | null>(null);

  // The song's clip, played in the editor while you pick it.
  const clipAudio = useRef<HTMLAudioElement>(null);
  const [clipPlaying, setClipPlaying] = useState(false);

  useEffect(() => () => { if (draft) URL.revokeObjectURL(draft.uri); }, [draft]);
  useEffect(() => {
    getStoryAudience().then((p) => setCloseFriendsCount(p.filter((x) => x.close_friend).length)).catch(() => {});
  }, []);

  const pick = async (file: File | undefined, knownMs?: number) => {
    if (!file) return;
    try {
      const d = await readDraft(file);
      if (d.video) d.durationMs ??= knownMs ?? null;
      if (d.video && !d.durationMs) throw new Error('Video length unknown');
      if (d.video && d.durationMs! > MAX_VIDEO_MS) {
        showAlert('Video too long', 'Stories can be up to 60 seconds. Trim it and try again.');
        return;
      }
      if (d.video && file.size > MAX_VIDEO_BYTES) {
        showAlert('Video too large', 'Story videos can be up to 50 MB.');
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

  const addLayer = (layer: Layer) => {
    setLayout((l) => ({ ...l, layers: [...l.layers, layer] }));
    setSelected(layer.id);
    setPanel(null);
  };
  const addText = (prefix = '') => addLayer({ ...DEFAULT_TEXT, id: newId(), text: prefix || 'Tap to edit' });
  const addSticker = (kind: StickerLayer['kind'], text: string) =>
    addLayer({ ...CENTRE, id: newId(), type: 'sticker', kind, text, size: kind === 'emoji' ? 180 : 84 });
  const addMention = (p: StoryAudienceMember) =>
    addLayer({ ...CENTRE, id: newId(), type: 'mention', userId: p.id, text: `@${p.name}`, size: 72 });

  const pickSong = (t: Track) => {
    const { duration_ms: _d, ...song } = t;
    void _d;
    setLayout((l) => ({
      ...l,
      music: { ...song, start: 0 },
      layers: [...l.layers.filter((x) => x.type !== 'music'),
        { id: newId(), type: 'music', text: '', style: 'card', size: 64, x: CANVAS_W / 2, y: CANVAS_H * 0.72, scale: 1, rotation: 0 }],
    }));
    setClipPlaying(false);
    setPanel(null);
  };
  const setClipStart = (start: number) => {
    setLayout((l) => (l.music ? { ...l, music: { ...l.music, start } } : l));
    if (clipAudio.current) clipAudio.current.currentTime = start;
  };
  const toggleClip = () => {
    const a = clipAudio.current;
    if (!a) return;
    if (clipPlaying) a.pause();
    else { keepInClip(a, layout.music?.start ?? 0); a.play().catch(() => {}); }
    setClipPlaying(!clipPlaying);
  };

  // ─── Moving layers ─────────────────────────────────────────────

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

  // ─── Drawing (the app's drawGesture) ───────────────────────────

  const toCanvas = (e: ReactPointerEvent): Point => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
  };
  const strokeFrom = (pts: Point[]): Stroke => {
    const b = brush === 'eraser' ? 'pen' : brush;
    const width = strokeWidthFor(b, drawSize);
    return { brush: b, color: drawColor, width, d: pathFromPoints(pts) + (b === 'arrow' && pts.length > 2 ? arrowHead(pts, width) : '') };
  };
  const eraseAt = (p: Point) => setLayout((l) => {
    const kept = l.strokes.filter((s) => !strokeHit(s, p, strokeWidthFor('eraser', drawSize) / 2));
    return kept.length === l.strokes.length ? l : { ...l, strokes: kept };
  });
  const drawDown = (e: ReactPointerEvent) => {
    if (!k) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toCanvas(e);
    points.current = [p];
    if (brush === 'eraser') { eraseStart.current = layout.strokes; eraseAt(p); } else setLive(strokeFrom([p]));
  };
  const drawMove = (e: ReactPointerEvent) => {
    const last = points.current[points.current.length - 1];
    if (!last) return;
    const p = toCanvas(e);
    if (Math.hypot(p.x - last.x, p.y - last.y) < 4) return;
    points.current.push(p);
    if (brush === 'eraser') eraseAt(p); else setLive(strokeFrom(points.current));
  };
  const drawUp = () => {
    if (!points.current.length) return;
    if (brush === 'eraser') {
      const before = eraseStart.current;
      if (before && before !== layout.strokes) setHistory((h) => [...h, before]);
      eraseStart.current = null;
    } else {
      const stroke = strokeFrom(points.current);
      setHistory((h) => [...h, layout.strokes]);
      setLayout((l) => ({ ...l, strokes: [...l.strokes, stroke] }));
    }
    points.current = [];
    setLive(null);
  };
  const undoDraw = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setLayout((l) => ({ ...l, strokes: prev }));
  };

  // ─── Share, save, close ────────────────────────────────────────

  const sel = layout.layers.find((l) => l.id === selected) ?? null;
  const isEmpty = !draft && !layout.strokes.length && !layout.layers.some((l) => l.type !== 'text' || l.text.trim());

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

  const save = async () => {
    setSaving(true);
    try {
      await saveStory(layout, draft?.uri ?? null, !!draft?.video);
    } catch (err) {
      console.error('Failed to save story', err);
      showAlert('Could not save', 'Please try again.');
    }
    setSaving(false);
  };

  const close = () => {
    if (!draft && !layout.layers.length && !layout.strokes.length) return router.back();
    showAlert('Discard story?', 'Your edits will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const music = layout.music;

  return (
    <main className="page" style={{ maxWidth: 1000 }}>
      <div className="page__head">
        <button className="icon-btn" onClick={close} aria-label="Close"><Icon name="close" /></button>
        <h1 className="page__title grow">New story</h1>
      </div>
      <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="row wrap" style={{ alignItems: 'flex-start', gap: 24 }}>
        <div ref={stageRef} style={{ width: 'min(100%, 380px)', borderRadius: 16, overflow: 'hidden', position: 'relative', touchAction: 'none', cursor: drawing ? 'crosshair' : undefined }}
          onPointerDown={drawing ? drawDown : () => setSelected(null)}
          onPointerMove={drawing ? drawMove : onPointerMove}
          onPointerUp={drawing ? drawUp : () => { drag.current = null; }}
          onPointerCancel={drawing ? drawUp : () => { drag.current = null; }}>
          <StoryCanvas layout={live ? { ...layout, strokes: [...layout.strokes, live] } : layout} mediaUri={draft?.uri ?? null} video={draft?.video} hideLayers>
            {layout.layers.map((l) => (
              <div key={l.id} style={{ ...placed(l), cursor: 'grab', pointerEvents: drawing ? 'none' : undefined, outline: l.id === selected ? `${3 / (k || 1)}px dashed #fff` : undefined, outlineOffset: 8 }}
                onPointerDown={(e) => onPointerDown(e, l)} onClick={(e) => e.stopPropagation()}>
                <LayerContent layer={l} music={music} />
              </div>
            ))}
          </StoryCanvas>
        </div>

        <div className="stack grow" style={{ minWidth: 260 }}>
          {drawing ? (
            <div className="card stack">
              <div className="row wrap">
                {BRUSH_ORDER.map((b) => <button key={b} className="chip" aria-pressed={brush === b} onClick={() => setBrush(b)}>{BRUSHES[b].label}</button>)}
                <button className="chip" aria-pressed={brush === 'eraser'} onClick={() => setBrush('eraser')}>Eraser</button>
              </div>
              {brush !== 'eraser' && <Swatches value={drawColor} onPick={setDrawColor} />}
              <label className="field">
                <span>Size</span>
                <input type="range" min={0} max={1} step={0.05} value={drawSize} onChange={(e) => setDrawSize(Number(e.target.value))} />
              </label>
              <div className="row wrap">
                <button className="btn btn--outline btn--sm" disabled={!history.length} onClick={undoDraw}><Icon name="rotateLeft" size={16} /> Undo</button>
                <button className="btn btn--primary btn--sm" onClick={() => setDrawing(false)}>Done</button>
              </div>
              <p className="small muted">Draw on the story with your mouse or finger.</p>
            </div>
          ) : (
            <>
              <div className="row wrap">
                <button className="btn btn--outline btn--sm" onClick={() => setPanel('camera')}><Icon name="video" size={16} /> Camera</button>
                <button className="btn btn--outline btn--sm" onClick={() => fileRef.current?.click()}><Icon name="image" size={16} /> {draft ? 'Change photo/video' : 'Upload'}</button>
                <button className="btn btn--outline btn--sm" onClick={() => addText()}>Aa Text</button>
                <button className="btn btn--outline btn--sm" onClick={() => setPanel('stickers')}>☺ Stickers</button>
                <button className="btn btn--outline btn--sm" onClick={() => { setSelected(null); setDrawing(true); }}><Icon name="pencil" size={16} /> Draw</button>
                {!draft && (
                  <button className="btn btn--outline btn--sm" onClick={() => setLayout((l) => {
                    // A text-only story cycles through the app's gradients.
                    const i = l.bg.kind === 'gradient' ? GRADIENTS.findIndex((g) => g[0] === (l.bg as { colors: [string, string] }).colors[0]) : -1;
                    return { ...l, bg: { kind: 'gradient', colors: GRADIENTS[(i + 1) % GRADIENTS.length] } };
                  })}>Background colour</button>
                )}
                <button className="btn btn--outline btn--sm" onClick={() => setPanel('music')}><Icon name="music" size={16} /> {music ? 'Change song' : 'Music'}</button>
                {music && <button className="btn btn--ghost btn--sm" onClick={() => { clipAudio.current?.pause(); setClipPlaying(false); setLayout((l) => ({ ...l, music: null, layers: l.layers.filter((x) => x.type !== 'music') })); }}>Remove song</button>}
                {draft?.video && !music && (
                  <button className="btn btn--ghost btn--sm" onClick={() => setLayout((l) => ({ ...l, videoMuted: !l.videoMuted }))}>{layout.videoMuted ? <><Icon name="mute" size={16} /> Sound off</> : <><Icon name="volume" size={16} /> Sound on</>}</button>
                )}
              </div>

              {music && (
                <div className="field">
                  <span>Song clip: {clock(music.start)}–{clock(music.start + MUSIC_CLIP_SECONDS)}</span>
                  <div className="row">
                    <button className="icon-btn" aria-label={clipPlaying ? 'Pause clip' : 'Play clip'} onClick={toggleClip}><Icon name={clipPlaying ? 'pause' : 'play'} size={14} filled={!clipPlaying} /></button>
                    <input className="grow" type="range" aria-label="Song clip start" min={0} max={MAX_CLIP_START} step={0.5} value={music.start} onChange={(e) => setClipStart(Number(e.target.value))} />
                  </div>
                  <audio ref={clipAudio} src={music.preview} onTimeUpdate={(e) => keepInClip(e.currentTarget, music.start)} onPause={() => setClipPlaying(false)} />
                </div>
              )}

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
                      <Swatches value={sel.color} onPick={(c) => updateLayer(sel.id, { color: c })} />
                      <div className="row wrap">
                        <button className="btn btn--outline btn--sm" onClick={() => updateLayer(sel.id, { bg: BGS[(BGS.indexOf(sel.bg) + 1) % BGS.length] })}>Background: {sel.bg}</button>
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <button key={a} className="chip" aria-pressed={sel.align === a} onClick={() => updateLayer(sel.id, { align: a })}>{a}</button>
                        ))}
                      </div>
                    </>
                  )}
                  {sel.type === 'music' && (
                    <button className="btn btn--outline btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => updateLayer(sel.id, { style: sel.style === 'card' ? 'mini' : 'card' })}>
                      Sticker: {sel.style === 'card' ? 'Card' : 'Mini'}
                    </button>
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
                {/* With nobody on the list yet, picking them comes first (as the app). */}
                <button className="btn btn--outline" disabled={isEmpty || !!posting} onClick={() => (closeFriends === 0 ? setPanel('friendsShare') : post('close_friends'))}>
                  {posting === 'close_friends' ? <Spinner small /> : 'Close Friends'}
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => setPanel('friends')}>Edit Close Friends</button>
                <button className="btn btn--ghost btn--sm" disabled={isEmpty || saving} onClick={save}>{saving ? <Spinner small /> : 'Save'}</button>
              </div>
            </>
          )}
        </div>
      </div>
      {panel === 'camera' && <CameraModal onCapture={(f, ms) => { setPanel(null); pick(f, ms); }} onClose={() => setPanel(null)} />}
      {panel === 'music' && <MusicPicker onPick={pickSong} onClose={() => setPanel(null)} />}
      {panel === 'mention' && <MentionModal onPick={addMention} onClose={() => setPanel(null)} />}
      {panel === 'stickers' && (
        <StickerModal onSticker={addSticker} onText={addText} onMention={() => setPanel('mention')} onMusic={() => setPanel('music')} onClose={() => setPanel(null)} />
      )}
      {(panel === 'friends' || panel === 'friendsShare') && (
        <CloseFriendsModal onClose={() => setPanel(null)} onSaved={(ids) => {
          setCloseFriendsCount(ids.length);
          if (panel === 'friendsShare' && ids.length) post('close_friends');
        }} />
      )}
    </main>
  );
}
