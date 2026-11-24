'use client';

// Takes a story photo or video with the device camera (the app's story-camera
// screen). The result goes through the editor's normal file pick.
import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui';
import { Icon } from '../icons';

const MAX_RECORD_MS = 60_000;
// Story uploads take mp4/mov only (backend uploadController STORY_VIDEO_EXTENSIONS).
// shortcut: no in-browser recording where MediaRecorder can't make mp4 (Firefox records webm only); upgrade if the backend accepts webm.
const RECORD_TYPE = ['video/mp4;codecs=avc1,mp4a', 'video/mp4'].find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t));

export function CameraModal({ onCapture, onClose }: { onCapture: (file: File, durationMs?: number) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [recordStart, setRecordStart] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const video = { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } };
    if (!navigator.mediaDevices) { setError('This browser cannot open the camera. Upload a photo or video instead.'); return; }
    // Without the mic (refused or missing) photos and silent videos still work.
    navigator.mediaDevices.getUserMedia({ video, audio: !!RECORD_TYPE })
      .catch(() => navigator.mediaDevices.getUserMedia({ video }))
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setError(null);
      })
      .catch(() => setError('Allow camera access in your browser to take a story.'));
    return () => {
      cancelled = true;
      // Closing mid-recording throws the clip away.
      if (recorder.current?.state === 'recording') { recorder.current.onstop = null; recorder.current.stop(); }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  // Recording timer, with the 60-second stop.
  useEffect(() => {
    if (recordStart === null) return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() - recordStart >= MAX_RECORD_MS) recorder.current?.stop();
    }, 200);
    return () => clearInterval(t);
  }, [recordStart]);

  const takePhoto = () => {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    if (facing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); } // keep the mirror the preview shows
    ctx.drawImage(v, 0, 0);
    c.toBlob((b) => b && onCapture(new File([b], 'camera.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.92);
  };

  const toggleRecord = () => {
    if (recorder.current?.state === 'recording') { recorder.current.stop(); return; }
    if (!streamRef.current || !RECORD_TYPE) return;
    const chunks: Blob[] = [];
    const r = new MediaRecorder(streamRef.current, { mimeType: RECORD_TYPE });
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const started = Date.now();
    r.onstop = () => {
      setRecordStart(null);
      // Recorded files often carry no duration in their metadata, so pass the clock's.
      if (chunks.length) onCapture(new File(chunks, 'camera.mp4', { type: 'video/mp4' }), Math.min(Date.now() - started, MAX_RECORD_MS));
    };
    recorder.current = r;
    r.start(1000);
    setRecordStart(started);
    setNow(started);
  };

  const recording = recordStart !== null;
  const seconds = recording ? Math.min(59, Math.floor((now - recordStart) / 1000)) : 0;

  return (
    <Modal title="Camera" onClose={onClose}>
      {error ? <p className="muted">{error}</p> : (
        <div className="stack">
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: '100%', maxHeight: '60vh', borderRadius: 12, background: '#000', transform: facing === 'user' ? 'scaleX(-1)' : undefined }} />
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button className="btn btn--outline btn--sm" disabled={recording} onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}>
              <Icon name="rotateRight" size={16} /> Flip
            </button>
            <button className="btn btn--primary" disabled={recording} onClick={takePhoto}><Icon name="image" size={16} /> Photo</button>
            {RECORD_TYPE && (
              <button className={recording ? 'btn btn--danger' : 'btn btn--outline'} onClick={toggleRecord}>
                <Icon name="video" size={16} /> {recording ? `Stop · 0:${String(seconds).padStart(2, '0')}` : 'Record'}
              </button>
            )}
          </div>
          {!RECORD_TYPE && <p className="small muted">This browser can only take photos. Upload a video instead.</p>}
        </div>
      )}
    </Modal>
  );
}
