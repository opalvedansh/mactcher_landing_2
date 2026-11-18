'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from './icons';

export function Spinner({ screen, small }: { screen?: boolean; small?: boolean }) {
  const s = <div className={small ? 'spinner spinner--sm' : 'spinner'} role="status" aria-label="Loading" />;
  return screen ? <div className="center">{s}</div> : s;
}

export function Avatar({ src, name, size = 44 }: { src?: string | null; name?: string | null; size?: number }) {
  if (src) return <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />;
  return (
    <div className="avatar avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {(name || '?').trim().charAt(0).toUpperCase()}
    </div>
  );
}

/** A centred dialog. Escape and a click on the backdrop close it. */
export function Modal({
  title, onClose, children, wide,
}: { title?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={wide ? 'sheet sheet--wide' : 'sheet'} role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <div className="sheet__head">
            <h2 className="sheet__title">{title}</h2>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** A short-lived message pill. `show(text)` replaces the current one. */
export function useToast() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(null), 2500);
    return () => clearTimeout(t);
  }, [text]);
  return { show: setText, node: text ? <div className="toast" role="status">{text}</div> : null };
}

/** The message an ApiError or Supabase error carries, for showing to the user. */
export function errorText(err: unknown, fallback = 'Something went wrong. Please try again.') {
  const e = err as { message?: string; status?: number } | null;
  if (e?.status === 429) return 'Too many requests. Please wait a moment and try again.';
  return e?.message || fallback;
}
