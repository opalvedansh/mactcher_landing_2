'use client';

// Plays a person's stories (mymatcher src/components/StoryViewer.tsx): one
// after another with progress bars, click left/right to step, space to pause.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoryViewers, recordStoryView } from '@/lib/matchr/api';
import { MUSIC_CLIP_SECONDS, keepInClip, readLayout, type StoryMusic } from '@/lib/matchr/story';
import { openSafetyMenu } from '@/lib/matchr/safetyMenu';
import { timeAgo } from '@/lib/matchr/utils/relativeTime';
import { Avatar, Modal, Spinner } from '../ui';
import { showAlert } from '../dialogs';
import { StoryCanvas } from './StoryCanvas';
import { saveStory } from './renderStory';
import { Icon } from '../icons';

export type StoryItem = {
  id: string; media_url: string | null; layout: unknown; media_type: 'image' | 'video' | null;
  duration_ms?: number | null; close_friends?: boolean; created_at: string;
};
export type StoryGroup = { id: string; name: string; avatar: string | null; isMe: boolean; items: StoryItem[] };

const STORY_DURATION = 5000;
const MAX_VIDEO_MS = 60_000;

const durationOf = (item: StoryItem, music?: StoryMusic | null) =>
  item.media_type === 'video' ? Math.min(item.duration_ms || STORY_DURATION, MAX_VIDEO_MS) : music ? MUSIC_CLIP_SECONDS * 1000 : STORY_DURATION;

export function StoryViewer({ groups, startIndex, onClose }: { groups: StoryGroup[]; startIndex: number; onClose: () => void }) {
  const router = useRouter();
  const [g, setG] = useState(startIndex);
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewers, setViewers] = useState<any[] | 'loading' | null>(null);
  const [held, setHeld] = useState(false);
  const [muted, setMuted] = useState(false);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const holdTimer = useRef<number>();
  const wasHeld = useRef(false);
  const group = groups[g];
  const item = group?.items[i];
  const layout = item ? readLayout(item.layout, !!item.media_url) : null;
  const duration = item ? durationOf(item, layout?.music) : STORY_DURATION;
  const holding = paused || held || viewers !== null || saving;

  // Press and hold pauses (the app's long press); a short press steps.
  const press = () => {
    wasHeld.current = false;
    holdTimer.current = window.setTimeout(() => { wasHeld.current = true; setHeld(true); }, 250);
  };
  const release = () => { clearTimeout(holdTimer.current); setHeld(false); };
  const tap = (go: () => void) => () => { if (!wasHeld.current) go(); };

  const next = useCallback(() => {
    if (!group) return;
    if (i < group.items.length - 1) setI(i + 1);
    else if (g < groups.length - 1 && groups[g + 1].items.length) { setG(g + 1); setI(0); }
    else onClose();
  }, [g, i, group, groups, onClose]);

  const prev = () => {
    if (i > 0) setI(i - 1);
    else if (g > 0 && groups[g - 1].items.length) { setG(g - 1); setI(groups[g - 1].items.length - 1); }
  };

  // Count a view once per story shown, never for your own.
  useEffect(() => {
    setProgress(0);
    if (item && !group.isMe) recordStoryView(item.id).catch(() => {});
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // The timer: requestAnimationFrame, so pausing simply stops adding time.
  useEffect(() => {
    if (!item || holding) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setProgress((p) => {
        const nextP = p + (now - last) / duration;
        if (nextP >= 1) { queueMicrotask(next); return 1; }
        return nextP;
      });
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item, holding, duration, next]);

  // The story's song plays its chosen clip.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !layout?.music) return;
    if (holding) a.pause();
    else a.play().catch(() => {});
  }, [holding, layout?.music, item?.id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (holding) v.pause();
    else v.play().catch(() => {});
  }, [holding, item?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewers !== null) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!group || !item || !layout) return null;
  const music = layout.music;

  return (
    <div className="overlay" style={{ background: 'rgba(0,0,0,0.92)' }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="story-stage" role="dialog" aria-label={`${group.name}'s story`}>
        <div className="story-stage__bars" aria-hidden="true">
          {group.items.map((it, n) => <span key={it.id}><i style={{ width: `${n < i ? 100 : n === i ? progress * 100 : 0}%` }} /></span>)}
        </div>
        <div className="story-stage__head">
          <Avatar src={group.avatar} name={group.name} size={32} />
          <b className="grow ellipsis">{group.name} <span className="small muted">{timeAgo(item.created_at)}{item.close_friends ? ' · Close friends' : ''}</span></b>
          {(item.media_type === 'video' || music) && (
            <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}><Icon name={muted ? 'mute' : 'volume'} size={14} /></button>
          )}
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'}><Icon name={paused ? 'play' : 'pause'} size={14} filled={paused} /></button>
          {!group.isMe && (
            <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Report or block" onClick={() => {
              setPaused(true);
              openSafetyMenu({ userId: group.id, name: group.name, target: { type: 'story', id: item.id }, onBlocked: onClose });
            }}><Icon name="more" width={3} /></button>
          )}
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <StoryCanvas key={item.id} layout={muted ? { ...layout, videoMuted: true } : layout} mediaUri={item.media_url} video={item.media_type === 'video'} videoRef={videoRef} onVideoEnd={next} />
        {music && (
          <>
            <audio key={item.id} ref={audioRef} src={music.preview} autoPlay muted={muted}
              onLoadedMetadata={(e) => { e.currentTarget.currentTime = music.start || 0; }}
              onTimeUpdate={(e) => keepInClip(e.currentTarget, music.start || 0)} />
            {/* Apple's terms: previews are credited and link to the song. */}
            <a href={music.url ?? undefined} target="_blank" rel="noreferrer" className="small ellipsis"
              style={{ position: 'absolute', top: 58, left: 14, right: 14, zIndex: 4, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
              ♫ {music.title} · {music.artist}
            </a>
          </>
        )}
        {(['prev', 'next'] as const).map((side) => (
          <button key={side} className="story-stage__nav" style={side === 'prev' ? { left: 0 } : { right: 0 }} aria-label={side === 'prev' ? 'Previous story' : 'Next story'}
            onPointerDown={press} onPointerUp={release} onPointerLeave={release} onContextMenu={(e) => e.preventDefault()}
            onClick={tap(side === 'prev' ? prev : next)} />
        ))}
        {layout.layers.filter((l) => l.type === 'mention').map((l) => (
          <button key={l.id} className="btn btn--light btn--sm" style={{ position: 'absolute', zIndex: 4, left: `${(l.x / 1080) * 100}%`, top: `${(l.y / 1920) * 100}%`, transform: 'translate(-50%,-50%)', opacity: 0 }}
            aria-label={`View ${l.text}'s profile`} onClick={() => { onClose(); router.push(`/app/profile/${(l as { userId: string }).userId}`); }}>{l.text}</button>
        ))}
        {group.isMe && (
          <div className="row" style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 4 }}>
            <button className="btn btn--sm" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={async () => { setViewers('loading'); setViewers(await getStoryViewers(item.id).catch(() => [])); }}>
              <Icon name="eye" size={16} /> Viewers
            </button>
            <button className="btn btn--sm" style={{ background: 'rgba(0,0,0,0.6)' }} disabled={saving} onClick={async () => {
              setSaving(true);
              try {
                await saveStory(layout, item.media_url, item.media_type === 'video');
              } catch (err) {
                console.error('Failed to save story', err);
                showAlert('Could not save', 'Please try again.');
              }
              setSaving(false);
            }}>{saving ? <Spinner small /> : 'Save'}</button>
          </div>
        )}
      </div>
      {viewers !== null && (
        <Modal title="Viewers" onClose={() => setViewers(null)}>
          {viewers === 'loading' ? <Spinner small /> : viewers.length === 0 ? <p className="muted">No views yet.</p> : (
            <div className="list">
              {viewers.map((v: any) => (
                <div key={v.id ?? v.user_id} className="list-item">
                  <Avatar src={v.avatar} name={v.name} size={36} />
                  <span className="grow">{v.name}</span>
                  {v.viewed_at && <span className="small muted">{timeAgo(v.viewed_at)}</span>}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
