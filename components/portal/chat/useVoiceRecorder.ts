'use client';

// Browser voice notes with MediaRecorder (mymatcher VoiceRecorder.tsx has the
// same web path). mp4 first: the iOS app can play it; webm is the fallback.
import { useRef, useState } from 'react';
import type { LocalFile } from '@/lib/matchr/chat/upload';

const MIN_MS = 800;

function pickMime() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

export function useVoiceRecorder(onDone: (file: LocalFile) => void, onError: (msg: string) => void) {
  const [recording, setRecording] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; chunks: Blob[]; cancelled: boolean } | null>(null);

  const start = async () => {
    if (rec.current) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError('Allow microphone access in your browser to record a voice message.');
      return;
    }
    const mimeType = pickMime();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64000 } : undefined);
    const state = { recorder, stream, chunks: [] as Blob[], cancelled: false };
    rec.current = state;
    const began = Date.now();
    recorder.ondataavailable = (e) => e.data.size && state.chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      rec.current = null;
      setRecording(false);
      const duration = Date.now() - began;
      if (state.cancelled || duration < MIN_MS) return;
      const type = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0];
      const blob = new Blob(state.chunks, { type });
      onDone({ kind: 'audio', uri: URL.createObjectURL(blob), mime: type, size: blob.size, duration_ms: duration, webFile: blob, name: `voice.${type.includes('mp4') ? 'm4a' : 'webm'}` });
    };
    recorder.start();
    setStartedAt(began);
    setRecording(true);
  };

  const stop = (cancel = false) => {
    if (!rec.current) return;
    rec.current.cancelled = cancel;
    rec.current.recorder.stop();
  };

  return { recording, startedAt, start, stop };
}
