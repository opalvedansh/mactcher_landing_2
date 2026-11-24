// Flattens a story into a PNG for "Save" (the app saves a snapshot of its
// canvas). Draws the same layout StoryCanvas shows, on a 1080x1920 canvas.
// shortcut: text is drawn with canvas fonts, so wrapping can differ by a word from the DOM; upgrade if saved images must match pixel-for-pixel.
import { CANVAS_H, CANVAS_W, FILTERS, FONTS, contrastOn, type Layer, type StoryLayout, type StoryMusic, type TextLayer } from '@/lib/matchr/story';
import { TEXT_WRAP } from './StoryCanvas';

type Ctx = CanvasRenderingContext2D;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

/** Cuts `text` with an ellipsis so it fits `maxW`. */
function fit(ctx: Ctx, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

function box(ctx: Ctx, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.fill();
}

/** White pill with one line of bold text, centred on the origin (stickers and mentions). */
function pill(ctx: Ctx, text: string, px: number, color: string, padX: number, padY: number, radius: number, base: string) {
  ctx.font = `800 ${px}px ${base}`;
  box(ctx, ctx.measureText(text).width + padX * 2, px * 1.2 + padY * 2, radius, '#FFFFFF');
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
}

function drawText(ctx: Ctx, l: TextLayer, base: string) {
  const font = FONTS[l.font] ?? FONTS.classic;
  const px = l.size;
  const hasBg = l.bg !== 'none';
  const padX = hasBg ? px * 0.3 : 0;
  const padY = hasBg ? px * 0.1 : 0;
  const lineH = px * 1.22;
  ctx.font = `${font.italic ? 'italic ' : ''}${font.weight} ${px}px ${font.family ?? base}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(font.letterSpacing ?? 0) * px}px`;

  // Wrap each paragraph to the same width the DOM uses.
  const maxW = TEXT_WRAP - padX * 2;
  const lines: string[] = [];
  for (const para of (font.upper ? l.text.toUpperCase() : l.text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const tryLine = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(tryLine).width > maxW) { lines.push(line); line = word; } else line = tryLine;
    }
    lines.push(line);
  }
  const w = Math.max(...lines.map((s) => ctx.measureText(s).width)) + padX * 2;
  const h = lines.length * lineH + padY * 2;

  if (l.bg === 'solid') box(ctx, w, h, px * 0.28, l.color);
  if (l.bg === 'soft') box(ctx, w, h, px * 0.28, contrastOn(l.color) === '#000000' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)');

  const glow = font.glow && !hasBg;
  ctx.fillStyle = glow ? '#FFFFFF' : l.bg === 'solid' ? contrastOn(l.color) : l.color;
  if (glow) {
    ctx.shadowColor = l.color === '#FFFFFF' ? '#FF6B2B' : l.color;
    ctx.shadowBlur = px * 0.35;
  } else if (!hasBg) {
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = px * 0.08;
    ctx.shadowOffsetY = px * 0.02;
  }
  ctx.textAlign = l.align;
  const x = l.align === 'left' ? -w / 2 + padX : l.align === 'right' ? w / 2 - padX : 0;
  lines.forEach((s, i) => ctx.fillText(s, x, -h / 2 + padY + lineH * (i + 0.5)));
}

async function drawMusic(ctx: Ctx, l: Layer, music: StoryMusic, base: string) {
  const px = l.size;
  if (l.type === 'music' && l.style === 'mini') {
    ctx.font = `800 ${px * 0.8}px ${base}`;
    pill(ctx, fit(ctx, `♫ ${music.title} · ${music.artist}`, 900 - px * 0.9), px * 0.8, '#111111', px * 0.45, px * 0.25, px, base);
    return;
  }
  const w = px * 9;
  const art = px * 1.8;
  box(ctx, w, art + px * 0.5, px * 0.35, '#FFFFFF');
  const left = -w / 2 + px * 0.25;
  const img = music.artwork ? await loadImage(music.artwork) : null;
  if (img) ctx.drawImage(img, left, -art / 2, art, art);
  const textX = left + art + px * 0.35;
  const textW = w / 2 - px * 0.25 - textX;
  ctx.textAlign = 'left';
  ctx.font = `800 ${px * 0.7}px ${base}`;
  ctx.fillStyle = '#111111';
  ctx.fillText(fit(ctx, music.title, textW), textX, -px * 0.32);
  ctx.font = `500 ${px * 0.6}px ${base}`;
  ctx.fillStyle = '#666666';
  ctx.fillText(fit(ctx, music.artist, textW), textX, px * 0.4);
}

export async function renderStoryPng(layout: StoryLayout, mediaUri: string | null): Promise<Blob> {
  await document.fonts.ready;
  const base = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d')!;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const photo = mediaUri ? await loadImage(mediaUri) : null;
  if (mediaUri && !photo) throw new Error('Could not load the story photo');

  // Background: CSS linear-gradient(160deg) or the blurred photo.
  if (layout.bg.kind === 'gradient') {
    const a = (160 * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const half = (Math.abs(CANVAS_W * dx) + Math.abs(CANVAS_H * dy)) / 2;
    const g = ctx.createLinearGradient(CANVAS_W / 2 - dx * half, CANVAS_H / 2 - dy * half, CANVAS_W / 2 + dx * half, CANVAS_H / 2 + dy * half);
    g.addColorStop(0, layout.bg.colors[0]);
    g.addColorStop(1, layout.bg.colors[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    if (photo) {
      const s = Math.max(CANVAS_W / photo.naturalWidth, CANVAS_H / photo.naturalHeight) * 1.2;
      ctx.filter = 'blur(60px) brightness(0.7)';
      ctx.drawImage(photo, (CANVAS_W - photo.naturalWidth * s) / 2, (CANVAS_H - photo.naturalHeight * s) / 2, photo.naturalWidth * s, photo.naturalHeight * s);
      ctx.filter = 'none';
    }
  }

  // The photo, fitted inside its box, with its filter blended over it.
  const p = layout.photo;
  if (photo && p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.scale(p.scale, p.scale);
    ctx.beginPath();
    ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.clip();
    const s = Math.min(p.w / photo.naturalWidth, p.h / photo.naturalHeight);
    ctx.drawImage(photo, (-photo.naturalWidth * s) / 2, (-photo.naturalHeight * s) / 2, photo.naturalWidth * s, photo.naturalHeight * s);
    for (const f of FILTERS[p.filter]?.passes ?? []) {
      ctx.globalAlpha = f.opacity;
      ctx.globalCompositeOperation = f.blend === 'normal' ? 'source-over' : f.blend;
      ctx.fillStyle = f.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  // Drawing, as StrokePath in StoryCanvas.
  ctx.lineJoin = 'round';
  for (const s of layout.strokes) {
    const path = new Path2D(s.d);
    const passes: [string, number, number][] = s.brush === 'neon'
      ? [[s.color, 2.6, 0.25], [s.color, 1.5, 0.55], ['#FFFFFF', 0.6, 1]]
      : [[s.color, 1, s.brush === 'marker' ? 0.55 : 1]];
    ctx.lineCap = s.brush === 'marker' ? 'square' : 'round';
    for (const [color, k, alpha] of passes) {
      ctx.strokeStyle = color;
      ctx.lineWidth = s.width * k;
      ctx.globalAlpha = alpha;
      ctx.stroke(path);
    }
  }
  ctx.globalAlpha = 1;

  for (const l of layout.layers) {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rotation);
    ctx.scale(l.scale, l.scale);
    const px = l.size;
    if (l.type === 'text') drawText(ctx, l, base);
    else if (l.type === 'music') { if (layout.music) await drawMusic(ctx, l, layout.music, base); }
    else if (l.type === 'mention') pill(ctx, l.text.toUpperCase(), px, '#FF6B2B', px * 0.4, px * 0.14, px * 0.3, base);
    else if (l.kind === 'emoji') { ctx.font = `${px}px ${base}`; ctx.fillText(l.text, 0, 0); }
    else pill(ctx, l.text, px, '#111111', px * 0.45, px * 0.15, px * 0.3, base);
    ctx.restore();
  }

  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('Could not make the image'))), 'image/png'));
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Saves a story to the device: photo and text stories as a PNG, videos as the original file (as the app does). */
export async function saveStory(layout: StoryLayout, mediaUri: string | null, video: boolean) {
  if (video && mediaUri) {
    const blob = await (await fetch(mediaUri)).blob();
    downloadBlob(blob, `matchr-story.${blob.type.includes('quicktime') ? 'mov' : 'mp4'}`);
  } else {
    downloadBlob(await renderStoryPng(layout, mediaUri), 'matchr-story.png');
  }
}
