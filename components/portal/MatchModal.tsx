'use client';

// Web version of mymatcher src/components/MatchBoomModal.tsx.
import { Avatar, Modal } from './ui';

export function MatchModal({ meAvatar, meName, themAvatar, themName, onClose, onIntroduce }: {
  meAvatar: string | null; meName?: string | null; themAvatar: string | null; themName: string;
  onClose: () => void; onIntroduce: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="stack" style={{ alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
        <p className="muted">It&apos;s a</p>
        <h2 style={{ fontSize: 56, fontWeight: 900, color: 'var(--accent)' }}>BOOM!</h2>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Avatar src={meAvatar} name={meName} size={96} />
          <Avatar src={themAvatar} name={themName} size={96} />
        </div>
        <p>You and <b>{themName}</b> liked each other.</p>
        <button className="btn btn--primary btn--block" onClick={onIntroduce}>Introduce yourself...</button>
        <button className="btn btn--ghost btn--block" onClick={onClose}>Keep Swiping</button>
      </div>
    </Modal>
  );
}
