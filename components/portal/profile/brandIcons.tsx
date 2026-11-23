// The brand profile's own icons, copied from mymatcher src/components/
// {CampaignIcons,VibeIcons,ReelsIcon,StoriesIcon,PostIcon}.tsx.
import type { ReactNode } from 'react';

const A = '#F05A28';

function Svg({ size, vb = '0 0 24 24', children }: { size: number; vb?: string; children: ReactNode }) {
  return <svg width={size} height={size} viewBox={vb} fill="none" aria-hidden="true" style={{ flex: 'none' }}>{children}</svg>;
}

const CAMPAIGN: Record<string, (c: string) => ReactNode> = {
  'Paid Collaboration': (c) => <><rect x="2" y="6" width="20" height="12" rx="3" stroke={c} strokeWidth="2" /><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2" /></>,
  'Product Review': (c) => <><rect x="4" y="3" width="16" height="18" rx="4" stroke={c} strokeWidth="2" /><path d="M9 11L11 13L15 9" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 17H16" stroke={c} strokeWidth="2" strokeLinecap="round" /></>,
  'UGC Campaign': (c) => <><path d="M20 4H4C2.9 4 2 4.9 2 6V15C2 16.1 2.9 17 4 17H9L12 21L15 17H20C21.1 17 22 16.1 22 15V6C22 4.9 21.1 4 20 4Z" stroke={c} strokeWidth="2" strokeLinejoin="round" /><path d="M12 12.5L11 11.5C8.5 9.2 7 7.8 7 6C7 4.3 8.3 3 10 3C11 3 11.9 3.5 12 4.3C12.1 3.5 13 3 14 3C15.7 3 17 4.3 17 6C17 7.8 15.5 9.2 13 11.5L12 12.5Z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
  'Brand Ambassador': (c) => <><circle cx="16" cy="7" r="3.5" fill="#999999" /><path d="M13 19V17C13 15.3431 14.3431 14 16 14H20C21.6569 14 23 15.3431 23 17V19" fill="#999999" /><circle cx="9" cy="9" r="4.5" fill={c} /><path d="M3 21V18.5C3 16.567 4.567 15 6.5 15H11.5C13.433 15 15 16.567 15 18.5V21" fill={c} /></>,
  'Event Coverage': (c) => <><rect x="3" y="4" width="18" height="18" rx="4" stroke={c} strokeWidth="2" /><path d="M3 10H21" stroke={c} strokeWidth="2" /><path d="M8 2V6" stroke={c} strokeWidth="2" strokeLinecap="round" /><path d="M16 2V6" stroke={c} strokeWidth="2" strokeLinecap="round" /></>,
};

const VIBE: Record<string, ReactNode> = {
  Premium: <><path d="M4.5 16L3.5 9L8 11.5L12 4L16 11.5L20.5 9L19.5 16H4.5Z" stroke={A} strokeWidth="2" strokeLinejoin="round" /><circle cx="3.5" cy="8" r="1.5" fill={A} /><circle cx="12" cy="3" r="1.5" fill={A} /><circle cx="20.5" cy="8" r="1.5" fill={A} /><path d="M5.5 19.5H18.5" stroke={A} strokeWidth="2" strokeLinecap="round" /></>,
  Minimal: <circle cx="12" cy="12" r="7" stroke={A} strokeWidth="3.5" />,
  Bold: <path d="M13 3L4 14H12L11 21L20 10H12L13 3Z" fill={A} stroke={A} strokeWidth="1.5" strokeLinejoin="round" />,
  Authentic: <><path d="M12 21.5C12 21.5 20 18 20 11.5V5L12 2.5L4 5V11.5C4 18 12 21.5 12 21.5Z" fill={A} /><path d="M9 11.5L11 13.5L15 9.5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></>,
  Genz: <><path d="M10 3L11.5 7.5L16 9L11.5 10.5L10 15L8.5 10.5L4 9L8.5 7.5L10 3Z" fill={A} stroke={A} strokeWidth="1.5" strokeLinejoin="round" /><path d="M17 14L17.75 16.25L20 17L17.75 17.75L17 20L16.25 17.75L14 17L16.25 16.25L17 14Z" fill={A} stroke={A} strokeWidth="1.5" strokeLinejoin="round" /></>,
};

// Unknown names (saved before the catalogue) fall back to a star, as the app's Ionicons fallback.
const STAR = <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.3l-5.9 3.2 1.2-6.5L2.5 9.4l6.6-.9z" stroke={A} strokeWidth="2" strokeLinejoin="round" />;

export const CampaignIcon = ({ type, size = 24 }: { type: string; size?: number }) => <Svg size={size}>{CAMPAIGN[type]?.(A) ?? STAR}</Svg>;
export const VibeIcon = ({ vibe, size = 22 }: { vibe: string; size?: number }) => <Svg size={size}>{VIBE[vibe] ?? STAR}</Svg>;

export const DELIVERABLE_ICON = {
  reels: (size: number) => (
    <Svg size={size} vb="0 0 19 19">
      <path d="M18.375 5.25H14.0618L10.6868 0H13.125C16.0245 0 18.375 2.35051 18.375 5.25Z" fill="white" />
      <path d="M5.25 0H9.12654L12.5015 5.25H7.93657L4.58814 0.0413208C4.80492 0.0140512 5.02582 0 5.25 0Z" fill="white" />
      <path d="M3.25379 0.392826C1.34434 1.17842 0 3.05722 0 5.25H6.37626L3.25379 0.392826Z" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M0 6.56207H18.375V13.1246C18.375 16.0241 16.0245 18.3746 13.125 18.3746H5.25C2.3505 18.3746 0 16.0241 0 13.1246V6.56207ZM12.2587 11.7781C12.5387 11.9391 12.5387 12.3413 12.2587 12.5023L7.84875 15.0367C7.56875 15.1976 7.21875 14.9965 7.21875 14.6746V9.60577C7.21875 9.28394 7.56875 9.08279 7.84875 9.24371L12.2587 11.7781Z" fill="white" />
    </Svg>
  ),
  stories: (size: number) => (
    <Svg size={size}>
      <rect x="2" y="2" width="20" height="20" rx="6" ry="6" stroke={A} strokeWidth="2.5" />
      <path d="M12 7V17M7 12H17" stroke={A} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  posts: (size: number) => (
    <Svg size={size}>
      <rect x="7" y="7" width="15" height="15" rx="4" fill={A} />
      <rect x="0" y="0" width="18" height="18" rx="5" fill="#000000" />
      <rect x="2" y="2" width="14" height="14" rx="3" fill={A} />
    </Svg>
  ),
};
