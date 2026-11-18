'use client';

// Creator face check (mymatcher VerificationModal.tsx) and brand business
// verification (BrandProfileScreen.tsx). The server decides both: the face
// check sets `verified` itself, and a business request only queues a review.
import { useEffect, useRef, useState } from 'react';
import { requestVerification, verifyFace } from '@/lib/matchr/api';
import type { VerificationRequestResult } from '@/lib/matchr/types';
import { Modal, Spinner, errorText } from '../ui';

// A small JPEG keeps the selfie well under the endpoint's 6 MB body limit.
const SELFIE_EDGE = 720;

export function FaceVerifyModal({ onClose, onVerified }: { onClose: () => void; onVerified: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'scanning' | 'success' | 'error' | 'denied'>('starting');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('ready');
      })
      .catch(() => setStatus('denied'));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const scan = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setStatus('scanning');
    const k = Math.min(1, SELFIE_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * k);
    canvas.height = Math.round(video.videoHeight * k);
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const res = await verifyFace(canvas.toDataURL('image/jpeg', 0.7));
      if (res.success) {
        setStatus('success');
        onVerified();
      } else {
        setStatus('error');
        setMessage(res.message || 'Face is not matching the uploaded image by the user.');
      }
    } catch (e) {
      setStatus('error');
      setMessage(errorText(e, 'Face is not matching the uploaded image by the user.'));
    }
  };

  return (
    <Modal title="Verify your profile" onClose={onClose}>
      {status === 'denied' ? (
        <div className="stack">
          <p className="muted">Camera access is required. Allow it for this site in your browser, then try again.</p>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      ) : (
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: 360, borderRadius: 16, transform: 'scaleX(-1)', background: '#000' }} />
          {status === 'success' ? (
            <><h3 className="accent">Verified!</h3><p>Your profile has been successfully verified.</p><button className="btn btn--primary" onClick={onClose}>Done</button></>
          ) : (
            <>
              <p className="muted">{status === 'error' ? message : 'Position your face in the frame. We compare it with your profile photo.'}</p>
              <button className="btn btn--primary" disabled={status !== 'ready' && status !== 'error'} onClick={scan}>
                {status === 'scanning' || status === 'starting' ? <Spinner small /> : status === 'error' ? 'Try Again' : 'Start Verification'}
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

export function BusinessVerifyModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (r: VerificationRequestResult) => void }) {
  const [businessName, setBusinessName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ok = businessName.trim().length >= 2 && regNumber.trim().length >= 4;

  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    setError('');
    try {
      onSubmitted(await requestVerification(businessName.trim(), regNumber.trim()));
    } catch (e) {
      setError(errorText(e, 'We could not send that. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Get verified" onClose={onClose}>
      <div className="stack">
        <p className="muted">Creators trust a verified business. Matchr checks these details before adding the badge.</p>
        <label className="field"><span>Registered business name</span><input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></label>
        <label className="field"><span>Registration number (GSTIN, CIN or similar)</span><input className="input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} /></label>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn--primary" disabled={!ok || busy} onClick={submit}>{busy ? <Spinner small /> : 'Submit for review'}</button>
      </div>
    </Modal>
  );
}
