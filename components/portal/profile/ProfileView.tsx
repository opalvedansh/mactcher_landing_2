'use client';

// Read-only profile for either role, shared by the own-profile and
// public-profile pages. Sections follow mymatcher's Brand/Influencer profile
// screens; only real data is shown (the mobile "engagement" and "audience"
// tabs hold placeholder figures, so they are left out here).
import type { ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type { BrandProfile, InfluencerProfile, AnyProfile, PaymentMode } from '@/lib/matchr/types';
import { compactCount, displayHandle, platformLabel } from '@/lib/matchr/utils/followers';
import { describePackage, type CreatorPackage } from '@/lib/matchr/utils/packages';
import { categoryLabel } from '@/lib/matchr/options';
import { formatBudget, isValidUrl } from '../ProfileCard';
import { Avatar } from '../ui';
import { CreatorReviews } from './CreatorReviews';
import { BrandRating } from './BrandRating';
import { Icon, Verified, type IconName } from '../icons';
import { CompanyLogo, PlatformLogo } from './brandLogos';

const PAYMENT_LABEL: Record<PaymentMode, string> = { bank_transfer: 'Bank transfer', upi: 'UPI', cheque: 'Cheque', paypal: 'PayPal' };

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="row row--between"><h2 className="section__title">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

function Platforms({ p }: { p: AnyProfile }) {
  const list = p.platforms ?? [];
  if (!list.length) return null;
  return (
    <Section title={p.role === 'brand' ? 'Active Platforms' : 'Available on'}>
      <div className="row wrap">
        {list.map((id) => {
          const count = p.platform_followers?.[id]?.count;
          const handle = displayHandle(id, p.platform_handles?.[id]);
          return (
            <span key={id} className="chip chip--static" title={handle || undefined}>
              {platformLabel(id)}{count != null && <b>{compactCount(count)}</b>}
              {p.platform_followers?.[id]?.source === 'synced' && <span className="accent" title="Fetched from the platform"><Icon name="check" size={14} /></span>}
            </span>
          );
        })}
      </div>
    </Section>
  );
}

function Gallery({ photos, title }: { photos?: string[]; title: string }) {
  const valid = (photos ?? []).filter(isValidUrl);
  if (!valid.length) return null;
  return (
    <Section title={title}>
      <div className="gallery">{valid.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" /></a>)}</div>
    </Section>
  );
}

// The photo scrolls at half speed under the panel, as in the app (off for reduced motion).
function ParallaxCover({ src }: { src: string | null }) {
  const { scrollY } = useScroll();
  const still = useReducedMotion();
  const y = useTransform(scrollY, [0, 600], [0, still ? 0 : 300]);
  return <div className="cp__cover">{src && <motion.img src={src} alt="" style={{ y }} />}</div>;
}

const PACKAGE_ICON: Record<CreatorPackage['type'], IconName> = { story: 'story', reel: 'reel', ugc: 'ugc', brand_collab: 'users', custom: 'star' };

// Laid out like the mobile app's creator profile (mymatcher
// InfluencerProfileScreen): cover photo, a rounded panel over it, centred
// identity, glass stat cards, logo rows, reels strip and package cards.
function CreatorProfile({ p, own, headerActions, onRequestQuote, children }: {
  p: InfluencerProfile; own: boolean; headerActions?: ReactNode; onRequestQuote?: () => void; children?: ReactNode;
}) {
  const cover = (isValidUrl(p.cover_url) && p.cover_url) || (p.photos ?? []).find(isValidUrl) || null;
  const stats = [
    p.followers > 0 && { v: compactCount(p.followers), l: 'Followers' },
    p.engagement_rate > 0 && { v: `${Number(p.engagement_rate).toFixed(1)}%`, l: 'Engagement' },
    p.avg_views > 0 && { v: compactCount(p.avg_views), l: 'Avg Views' },
  ].filter(Boolean) as { v: string; l: string }[];
  const workedWith = p.worked_with ?? [];
  const platforms = p.platforms ?? [];
  const reels = p.reels ?? [];
  const packages = p.packages ?? [];
  const insta = p.instagram_handle?.replace(/^@/, '');

  return (
    <div className="cp">
      <ParallaxCover src={cover} />
      <div className="cp__panel">
        <div className="cp__avatar"><Avatar src={isValidUrl(p.avatar_url) ? p.avatar_url : null} name={p.name} size={98} /></div>
        <h1 className="cp__name">{p.name || (own ? 'Your Profile' : 'Creator')}{p.age ? `, ${p.age}` : ''}{p.verified && <Verified size={22} />}</h1>
        {(p.categories ?? []).length > 0 && <p className="cp__cats">{p.categories.map(categoryLabel).join(' & ')}</p>}
        {p.location && <p className="cp__loc"><Icon name="pin" size={16} />{p.location}</p>}
        {p.bio ? <p className="cp__bio">{p.bio}</p> : own && <p className="cp__bio muted">Add a bio so brands know what you do.</p>}
        {headerActions && <div className="cp__actions">{headerActions}</div>}

        {stats.length > 0 && (
          <div className="cp__stats">{stats.map((s) => <div key={s.l} className="cp__stat"><b>{s.v}</b><span>{s.l}</span></div>)}</div>
        )}

        {children}

        {workedWith.length > 0 && (
          <section className="cp__group">
            <h2>Worked With</h2>
            <div className="cp__logos">{workedWith.map((c) => <CompanyLogo key={c} name={c} />)}</div>
          </section>
        )}

        {platforms.length > 0 && (
          <section className="cp__group">
            <h2>Available on</h2>
            <div className="cp__logos">
              {platforms.map((id) => {
                const count = p.platform_followers?.[id]?.count;
                const handle = displayHandle(id, p.platform_handles?.[id]);
                return (
                  <span key={id} className="cp__logo" title={handle || undefined} aria-label={count != null ? `${platformLabel(id)}, ${compactCount(count)} followers` : platformLabel(id)}>
                    <PlatformLogo id={id} />
                    {count != null && compactCount(count)}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {reels.length > 0 && (
          <section>
            <div className="cp__head">
              <h2>Top Reels</h2>
              {insta && <a className="cp__more" href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer">see more</a>}
            </div>
            <div className="cp__reels">
              {reels.map((r) => (
                <a key={r.id} className="cp__reel" href={r.url} target="_blank" rel="noreferrer" aria-label={`Reel${r.views ? `, ${r.views} views` : ''}`}>
                  {r.thumbnail_url ? <img src={r.thumbnail_url} alt="" /> : <span className="cp__reel-empty"><i className="fa-brand">{''}</i></span>}
                  {r.views && <span className="cp__reel-views"><Icon name="play" size={11} width={2.4} />{r.views}</span>}
                </a>
              ))}
            </div>
          </section>
        )}

        {(packages.length > 0 || onRequestQuote) && (
          <section>
            <div className="cp__head cp__head--lg"><h2>Packages</h2><span className="cp__cur">INR</span></div>
            <div className="cp__pkgs">
              {packages.map((pkg, i) => {
                const { name, desc } = describePackage(pkg);
                return (
                  <div key={i} className="cp__pkg">
                    <span className="cp__pkg-icon"><Icon name={PACKAGE_ICON[pkg.type]} size={28} width={2} /></span>
                    <div className="cp__pkg-body"><b>{name}</b>{desc && <span>{desc}</span>}</div>
                    <span className="cp__pkg-price">{pkg.price.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
              {onRequestQuote && (
                <div className="cp__pkg">
                  <span className="cp__plus"><Icon name="plus" size={20} /></span>
                  <div className="cp__pkg-body"><b>Custom package</b><span>Have something else in mind?</span></div>
                  <button className="cp__quote" onClick={onRequestQuote}>Request Quote</button>
                </div>
              )}
            </div>
          </section>
        )}

        {(p.photos ?? []).filter(isValidUrl).length > 0 && (
          <section>
            <div className="cp__head"><h2>Photos</h2></div>
            <div className="gallery">{p.photos!.filter(isValidUrl).map((src) => <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" /></a>)}</div>
          </section>
        )}

        <section className="cp__reviews">
          <div className="cp__head"><h2>Reviews</h2></div>
          <CreatorReviews creatorId={p.user_id} isOwnProfile={own} />
        </section>
      </div>
    </div>
  );
}

function BrandSections({ p }: { p: BrandProfile }) {
  const budget = formatBudget(p.budget_min, p.budget_max);
  const deliverables = [
    p.deliverable_reels ? `${p.deliverable_reels} Reel${p.deliverable_reels > 1 ? 's' : ''}` : null,
    p.deliverable_stories ? `${p.deliverable_stories} Stor${p.deliverable_stories > 1 ? 'ies' : 'y'}` : null,
    p.deliverable_posts ? `${p.deliverable_posts} Post${p.deliverable_posts > 1 ? 's' : ''}` : null,
  ].filter(Boolean);
  const payment = p.payment_mode
    ? `${PAYMENT_LABEL[p.payment_mode]}${p.payment_days ? `, within ${p.payment_days} days` : ''}`
    : null;
  return (
    <>
      <Platforms p={p} />
      {(p.vibes ?? []).length > 0 && (
        <Section title="Brand vibe"><div className="row wrap">{p.vibes.map((v) => <span key={v} className="chip chip--static">{v}</span>)}</div></Section>
      )}
      <Section title="Brand campaign">
        <div className="stat-grid">
          <div className="stat"><span className="muted small">Campaign budget</span><b>{budget ?? 'Negotiable'}</b><span className="muted small">per collaboration</span></div>
          <div className="stat"><span className="muted small">Campaign Period</span><b>{p.campaign_days ? `${p.campaign_days} days` : 'Not set'}</b></div>
          <div className="stat"><span className="muted small">Deliverables</span><b style={{ fontSize: 16 }}>{deliverables.length ? deliverables.join(' · ') : 'Not set'}</b></div>
          <div className="stat"><span className="muted small">Payment</span><b style={{ fontSize: 16 }}>{payment ?? 'Not set'}</b></div>
        </div>
        {(p.campaign_types ?? []).length > 0 && (
          <div className="row wrap" style={{ marginTop: 12 }}>{p.campaign_types.map((t) => <span key={t} className="chip chip--static">{t}</span>)}</div>
        )}
      </Section>
      <Gallery photos={p.photos} title="Campaign photos" />
      <Section title="Brand rating"><BrandRating brandId={p.user_id} /></Section>
    </>
  );
}

export function ProfileView({ profile: p, own, headerActions, onRequestQuote, children }: {
  profile: AnyProfile;
  own: boolean;
  /** Buttons beside the name (edit, menu, message…). */
  headerActions?: ReactNode;
  /** Creator profiles: shows the "Custom package" card; only passed when the viewer can message them. */
  onRequestQuote?: () => void;
  /** Extra sections shown under the header (own-profile tools). */
  children?: ReactNode;
}) {
  if (p.role !== 'brand') {
    return <CreatorProfile p={p as InfluencerProfile} own={own} headerActions={headerActions} onRequestQuote={onRequestQuote}>{children}</CreatorProfile>;
  }
  const brand = p as BrandProfile;
  const picture = brand.logo_url;
  const cover = (isValidUrl(p.cover_url) && p.cover_url) || (p.photos ?? []).find(isValidUrl) || null;
  const website = brand.website;

  return (
    <div>
      <div className="profile-hero">
        {cover ? <img className="profile-hero__cover" src={cover} alt="" /> : <div className="profile-hero__cover" />}
        <div className="profile-hero__body stack">
          <div className="row row--between" style={{ alignItems: 'flex-end' }}>
            <div className="profile-hero__avatar" style={{ borderRadius: '50%' }}>
              <Avatar src={isValidUrl(picture) ? picture : null} name={p.name} size={96} />
            </div>
            <div className="row">{headerActions}</div>
          </div>
          <h1 style={{ fontSize: 28 }}>{p.name || (own ? 'Your Profile' : 'Brand')} {p.verified && <Verified size={22} />}</h1>
          {(p.categories ?? []).length > 0 && <p className="muted-2">{p.categories.map(categoryLabel).join(', ')}</p>}
          <div className="row wrap muted small" style={{ gap: 14 }}>
            {p.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={15} />{p.location}</span>}
            {website && <a href={/^https?:\/\//.test(website) ? website : `https://${website}`} target="_blank" rel="noreferrer">{website}</a>}
          </div>
          {p.bio ? <p style={{ whiteSpace: 'pre-wrap' }}>{p.bio}</p> : own && <p className="muted">Add a bio so creators know what you do.</p>}
        </div>
      </div>
      {children}
      <BrandSections p={brand} />
    </div>
  );
}
