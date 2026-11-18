'use client';

// Web version of mymatcher src/features/swipe/SwipeDeck.tsx: drag the top
// card past the threshold (or fling it), or use the buttons / arrow keys.
import { useEffect, useRef, type MutableRefObject, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { SwipeDir } from '@/lib/matchr/useSwipeQueue';
import { Icon, NavIcon } from './icons';

const DISTANCE = 120;
const VELOCITY = 600;

function TopCard({ children, onSwipe, flingRef, onOpen, label }: {
  children: ReactNode;
  onSwipe: (dir: SwipeDir) => void;
  flingRef: MutableRefObject<((dir: SwipeDir) => void) | null>;
  onOpen: () => void;
  label: string;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], [-14, 14]);
  const likeOpacity = useTransform(x, [20, DISTANCE], [0, 1]);
  const nopeOpacity = useTransform(x, [-DISTANCE, -20], [1, 0]);
  const gone = useRef(false);

  const fling = (dir: SwipeDir) => {
    if (gone.current) return;
    gone.current = true;
    animate(x, dir === 'right' ? 700 : -700, { duration: 0.28, ease: 'easeIn' }).then(() => onSwipe(dir));
  };
  flingRef.current = fling;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > DISTANCE || info.velocity.x > VELOCITY) fling('right');
    else if (info.offset.x < -DISTANCE || info.velocity.x < -VELOCITY) fling('left');
    else animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
  };

  return (
    <motion.div
      className="swipe-card" style={{ x, rotate, zIndex: 2 }}
      drag="x" dragElastic={0.9} dragConstraints={{ left: 0, right: 0 }} onDragEnd={onDragEnd}
      role="group" aria-roledescription="card" aria-label={label}
    >
      {children}
      <motion.div className="stamp stamp--like" style={{ opacity: likeOpacity }}>LIKE</motion.div>
      <motion.div className="stamp stamp--nope" style={{ opacity: nopeOpacity }}>NOPE</motion.div>
      <button className="icon-btn swipe-card__info" onClick={onOpen} aria-label={`View ${label}'s profile`}><Icon name="info" size={22} width={1.8} /></button>
    </motion.div>
  );
}

export function SwipeDeck<T>({ items, keyOf, labelOf, renderCard, onSwipe, onOpen }: {
  items: T[];
  keyOf: (item: T) => string;
  labelOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onSwipe: (item: T, dir: SwipeDir) => void;
  onOpen: (item: T) => void;
}) {
  const flingRef = useRef<((dir: SwipeDir) => void) | null>(null);
  const [top, next] = items;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (document.querySelector('.overlay')) return;
      if (e.key === 'ArrowRight') flingRef.current?.('right');
      if (e.key === 'ArrowLeft') flingRef.current?.('left');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!top) return null;
  return (
    <>
      <div className="deck">
        {next && <div className="swipe-card" style={{ transform: 'scale(0.95)', zIndex: 1 }} aria-hidden="true">{renderCard(next)}</div>}
        <TopCard key={keyOf(top)} flingRef={flingRef} label={labelOf(top)} onOpen={() => onOpen(top)} onSwipe={(dir) => onSwipe(top, dir)}>
          {renderCard(top)}
        </TopCard>
      </div>
      <div className="deck-actions">
        <button className="icon-btn deck-actions__pass" onClick={() => flingRef.current?.('left')} aria-label="Pass"><Icon name="close" size={26} width={2.6} /></button>
        <button className="icon-btn deck-actions__like" onClick={() => flingRef.current?.('right')} aria-label="Like"><NavIcon name="heart" size={26} /></button>
      </div>
      <p className="deck-hint">Drag the card, or press <kbd aria-label="left arrow">←</kbd> <kbd aria-label="right arrow">→</kbd></p>
    </>
  );
}
