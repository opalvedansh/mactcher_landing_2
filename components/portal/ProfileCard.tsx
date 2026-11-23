// The face of a swipe card, for either role. Only real profile data reaches
// the card; missing figures are left out rather than shown as zero.
import type { BrandProfile, InfluencerProfile } from '@/lib/matchr/types';
import { compactCount } from '@/lib/matchr/utils/followers';
import { categoryLabel } from '@/lib/matchr/options';
import { Icon } from './icons';
import { CompanyLogo } from './profile/brandLogos';

export const isValidUrl = (url?: string | null): url is string =>
  !!url && !url.startsWith('blob:') && !url.startsWith('file://');

const formatInr = (amount: number) =>
  amount >= 100_000 ? `₹${+(amount / 100_000).toFixed(1)}L` : amount >= 1000 ? `₹${Math.round(amount / 1000)}k` : `₹${amount}`;

export function formatBudget(min?: number | null, max?: number | null) {
  if (min && max) return `${formatInr(min)}-${formatInr(max).slice(1)}`;
  if (min) return `${formatInr(min)}+`;
  if (max) return `Up to ${formatInr(max)}`;
  return null;
}

// `logo`: the image is a logo, shown whole rather than cropped like a photo.
// `lead`: an accent pill in front of the tags, naming what they are.
type Card = { image: string | null; logo?: boolean; lead?: string; name: string; verified: boolean; subtitle: string; location: string; tags: string[]; stats: { value: string; label: string }[]; workedWith?: string[] };

export function brandCard(p: BrandProfile): Card {
  const stats: Card['stats'] = [];
  const budget = formatBudget(p.budget_min, p.budget_max);
  if (budget) stats.push({ value: budget, label: 'Budget Range' });
  if (p.vibes?.length) stats.push({ value: p.vibes[0], label: 'Brand Vibe' });
  if (p.campaign_types?.length) stats.push({ value: String(p.campaign_types.length), label: p.campaign_types.length === 1 ? 'Campaign Type' : 'Campaign Types' });
  return {
    image: (isValidUrl(p.cover_url) ? p.cover_url : null) ?? (isValidUrl(p.logo_url) ? p.logo_url : null),
    logo: !isValidUrl(p.cover_url),
    name: p.name || 'Brand',
    verified: !!p.verified,
    subtitle: (p.categories ?? []).map(categoryLabel).join(' · '),
    location: p.location ?? '',
    lead: 'Looking for',
    tags: p.campaign_types ?? [],
    stats,
  };
}

// Audience figures appear only when they came from an Instagram sync: a brand
// deciding who to pay should never see a typed-in number as a measurement.
export function creatorCard(p: InfluencerProfile): Card {
  const stats: Card['stats'] = [];
  if (p.stats_verified) {
    if (p.followers > 0) stats.push({ value: compactCount(p.followers), label: 'Followers' });
    if (p.engagement_rate > 0) stats.push({ value: `${Number(p.engagement_rate).toFixed(1)}%`, label: 'Engagement' });
    if (p.avg_views > 0) stats.push({ value: compactCount(p.avg_views), label: 'Avg views' });
  }
  return {
    image: isValidUrl(p.avatar_url) ? p.avatar_url : (p.photos ?? []).find(isValidUrl) ?? null,
    name: p.name || 'Creator',
    verified: !!p.verified,
    subtitle: (p.categories ?? []).join(' · '),
    location: p.location ?? '',
    lead: 'Creates',
    tags: p.categories ?? [],
    stats,
    workedWith: p.worked_with ?? [],
  };
}

const SHOWN_WORKED = 5;

export function ProfileCard({ card }: { card: Card }) {
  return (
    <>
      {card.image ? <img src={card.image} alt="" draggable={false} className={card.logo ? 'swipe-card__logo' : undefined} /> : (
        <div className="center" style={{ minHeight: '100%', fontSize: 120, fontWeight: 800, color: '#333' }}>{card.name.charAt(0).toUpperCase()}</div>
      )}
      {card.verified && <span className="sc-verified"><Icon name="check" size={13} width={3} /> Verified</span>}
      <div className="swipe-card__shade">
        <h2 className="sc-name">{card.name}</h2>
        {card.subtitle && <p className="sc-cats">{card.subtitle}</p>}
        {card.location && <p className="sc-loc"><Icon name="pin" size={13} />{card.location}</p>}
        {card.tags.length > 0 && <div className="sc-tags">{card.lead && <span className="sc-pill sc-pill--lead">{card.lead}</span>}{card.tags.map((t) => <span key={t} className="sc-pill">{t}</span>)}</div>}
        {card.stats.length > 0 && (
          <div className="sc-stats">
            {card.stats.map((s) => <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>)}
          </div>
        )}
        {!!card.workedWith?.length && (
          <div className="sc-worked">
            <span>Worked With</span>
            <div>
              {card.workedWith.slice(0, SHOWN_WORKED).map((c) => <CompanyLogo key={c} name={c} />)}
              {card.workedWith.length > SHOWN_WORKED && <b className="cp__circle">+{card.workedWith.length - SHOWN_WORKED}</b>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
