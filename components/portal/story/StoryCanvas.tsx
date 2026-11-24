'use client';

// Draws a story layout (mymatcher src/features/story/StoryCanvas.tsx) on the
// web: a 1080x1920 canvas in canvas units, scaled to fit its container.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  CANVAS_H, CANVAS_W, FILTERS, FONTS, contrastOn,
  type Layer, type StoryLayout, type StoryMusic, type Stroke, type TextLayer,
} from '@/lib/matchr/story';

export const TEXT_WRAP = CANVAS_W - 120;

/** Scale factor that fits the canvas into the element's width. */
export function useCanvasScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(e.contentRect.width / CANVAS_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, k };
}

export function textLayerStyle(layer: TextLayer): CSSProperties {
  const font = FONTS[layer.font] ?? FONTS.classic;
  const px = layer.size;
  let color = layer.color;
  let background: string | undefined;
  if (layer.bg === 'solid') {
    background = layer.color;
    color = contrastOn(layer.color);
  } else if (layer.bg === 'soft') {
    background = contrastOn(layer.color) === '#000000' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)';
  }
  const glow = font.glow && layer.bg === 'none';
  return {
    maxWidth: TEXT_WRAP,
    background,
    borderRadius: background ? px * 0.28 : 0,
    padding: background ? `${px * 0.1}px ${px * 0.3}px` : 0,
    color: glow ? '#FFFFFF' : color,
    fontSize: px,
    lineHeight: 1.22,
    fontFamily: font.family ?? 'inherit',
    fontWeight: Number(font.weight),
    fontStyle: font.italic ? 'italic' : 'normal',
    textTransform: font.upper ? 'uppercase' : 'none',
    letterSpacing: font.letterSpacing ? font.letterSpacing * px : 0,
    textAlign: layer.align,
    whiteSpace: 'pre-wrap',
    textShadow: glow
      ? `0 0 ${px * 0.35}px ${layer.color === '#FFFFFF' ? '#FF6B2B' : layer.color}`
      : background ? undefined : `0 ${px * 0.02}px ${px * 0.08}px rgba(0,0,0,0.25)`,
  };
}

const pill: CSSProperties = { background: '#fff', color: '#111', fontWeight: 800, whiteSpace: 'nowrap' };

export function LayerContent({ layer, music }: { layer: Layer; music?: StoryMusic | null }) {
  const px = layer.size;
  if (layer.type === 'mention') {
    return <div style={{ ...pill, color: '#FF6B2B', fontSize: px, padding: `${px * 0.14}px ${px * 0.4}px`, borderRadius: px * 0.3 }}>{layer.text.toUpperCase()}</div>;
  }
  if (layer.type === 'music') {
    if (!music) return null;
    if (layer.style === 'mini') {
      return <div style={{ ...pill, fontSize: px * 0.8, padding: `${px * 0.25}px ${px * 0.45}px`, borderRadius: px, maxWidth: 900, overflow: 'hidden', textOverflow: 'ellipsis' }}>♫ {music.title} · <span style={{ fontWeight: 500 }}>{music.artist}</span></div>;
    }
    return (
      <div style={{ ...pill, display: 'flex', alignItems: 'center', gap: px * 0.35, padding: px * 0.25, borderRadius: px * 0.35, width: px * 9 }}>
        {music.artwork ? <img src={music.artwork} alt="" style={{ width: px * 1.8, height: px * 1.8, borderRadius: px * 0.2 }} /> : <div style={{ width: px * 1.8, height: px * 1.8, fontSize: px }}>♫</div>}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: px * 0.7, overflow: 'hidden', textOverflow: 'ellipsis' }}>{music.title}</div>
          <div style={{ fontSize: px * 0.6, fontWeight: 500, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis' }}>{music.artist}</div>
        </div>
      </div>
    );
  }
  if (layer.type === 'sticker') {
    if (layer.kind === 'emoji') return <div style={{ fontSize: px, lineHeight: 1.2 }}>{layer.text}</div>;
    return <div style={{ ...pill, fontSize: px, padding: `${px * 0.15}px ${px * 0.45}px`, borderRadius: px * 0.3, fontVariantNumeric: 'tabular-nums' }}>{layer.text}</div>;
  }
  return <div style={textLayerStyle(layer)}>{layer.text}</div>;
}

/** Positions a layer at its centre point, turned and scaled. */
export function placed(p: { x: number; y: number; scale: number; rotation: number }): CSSProperties {
  return { position: 'absolute', left: p.x, top: p.y, transform: `translate(-50%, -50%) rotate(${p.rotation}rad) scale(${p.scale})` };
}

// Drawn as the app's StrokePath. An arrow's head is already part of its `d`.
function StrokePath({ s }: { s: Stroke }) {
  const common = { d: s.d, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (s.brush === 'neon') {
    return (
      <>
        <path {...common} stroke={s.color} strokeWidth={s.width * 2.6} strokeOpacity={0.25} />
        <path {...common} stroke={s.color} strokeWidth={s.width * 1.5} strokeOpacity={0.55} />
        <path {...common} stroke="#FFFFFF" strokeWidth={s.width * 0.6} />
      </>
    );
  }
  if (s.brush === 'marker') return <path {...common} stroke={s.color} strokeWidth={s.width} strokeOpacity={0.55} strokeLinecap="square" />;
  return <path {...common} stroke={s.color} strokeWidth={s.width} />;
}

/**
 * A story as viewers see it. `children` draws over everything (the editor's
 * draggable layers use it instead of `layout.layers`).
 */
export function StoryCanvas({ layout, mediaUri, video, videoRef, hideLayers, children, onVideoEnd }: {
  layout: StoryLayout;
  mediaUri: string | null;
  video?: boolean;
  videoRef?: React.Ref<HTMLVideoElement>;
  hideLayers?: boolean;
  children?: ReactNode;
  onVideoEnd?: () => void;
}) {
  const { ref, k } = useCanvasScale();
  const photo = layout.photo;
  const filter = photo ? FILTERS[photo.filter]?.passes ?? [] : [];
  const bg: CSSProperties = layout.bg.kind === 'gradient'
    ? { background: `linear-gradient(160deg, ${layout.bg.colors[0]}, ${layout.bg.colors[1]})` }
    : { background: '#000' };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, overflow: 'hidden', ...bg }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: CANVAS_W, height: CANVAS_H, transform: `scale(${k})`, transformOrigin: '0 0' }}>
        {layout.bg.kind === 'blur' && mediaUri && !video && (
          <img src={mediaUri} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(60px) brightness(0.7)', transform: 'scale(1.2)' }} />
        )}
        {photo && mediaUri && (
          <div style={{ ...placed(photo), width: photo.w, height: photo.h, overflow: 'hidden' }}>
            {video ? (
              <video ref={videoRef} src={mediaUri} autoPlay playsInline muted={!!layout.videoMuted || !!layout.music} onEnded={onVideoEnd}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <img src={mediaUri} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
            {filter.map((f, i) => (
              <div key={i} style={{ position: 'absolute', inset: 0, background: f.color, opacity: f.opacity, mixBlendMode: f.blend as CSSProperties['mixBlendMode'] }} />
            ))}
          </div>
        )}
        {layout.strokes.length > 0 && (
          <svg width={CANVAS_W} height={CANVAS_H} style={{ position: 'absolute', inset: 0 }}>
            {layout.strokes.map((s, i) => <StrokePath key={i} s={s} />)}
          </svg>
        )}
        {!hideLayers && layout.layers.map((l) => (
          <div key={l.id} style={placed(l)}><LayerContent layer={l} music={layout.music} /></div>
        ))}
        {children}
      </div>
    </div>
  );
}
