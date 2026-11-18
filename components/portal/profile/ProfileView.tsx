'use client';

// Read-only profile for either role, shared by the own-profile and
// public-profile pages. Sections follow mymatcher's Brand/Influencer profile
// screens; only real data is shown (the mobile "engagement" and "audience"
// tabs hold placeholder figures, so they are left out here).
import type { ReactNode } from 'react';
import type { BrandProfile, InfluencerProfile, AnyProfile, PaymentMode } from '@/lib/matchr/types';
import { compactCount, displayHandle, platformLabel } from '@/lib/matchr/utils/followers';
import { describePackage, formatPrice } from '@/lib/matchr/utils/packages';
import { categoryLabel } from '@/lib/matchr/options';
import { formatBudget, isValidUrl } from '../ProfileCard';
import { Avatar } from '../ui';
import { CreatorReviews } from './CreatorReviews';
import { BrandRating } from './BrandRating';
import { Icon, Verified } from '../icons';

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

function CreatorSections({ p, own }: { p: InfluencerProfile; own: boolean }) {
  const stats = [
    p.followers > 0 && { v: compactCount(p.followers), l: 'Followers' },
    p.engagement_rate > 0 && { v: `${Number(p.engagement_rate).toFixed(1)}%`, l: 'Engagement' },
    p.avg_views > 0 && { v: compactCount(p.avg_views), l: 'Avg views' },
  ].filter(Boolean) as { v: string; l: string }[];
  const packages = p.packages ?? [];
  const reels = p.reels ?? [];
  return (
    <>
      {stats.length > 0 && (
        <Section title="Audience">
          <div className="stat-grid">{stats.map((s) => <div key={s.l} className="stat"><b>{s.v}</b><span className="muted small">{s.l}</span></div>)}</div>
        </Section>
      )}
      {(p.worked_with ?? []).length > 0 && (
        <Section title="Worked With">
          <div className="row wrap">{p.worked_with!.map((c) => <span key={c} className="chip chip--static">{c}</span>)}</div>
        </Section>
      )}
      <Platforms p={p} />
      {reels.length > 0 && (
        <Section title="Top Reels">
          <div className="grid-cards">
            {reels.map((r) => (
              <a key={r.id} className="tile" href={r.url} target="_blank" rel="noreferrer">
                {r.thumbnail_url ? <img src={r.thumbnail_url} alt="" /> : <div className="center muted small" style={{ minHeight: '100%' }}>Instagram reel</div>}
                {r.views && <div className="tile__label small row" style={{ gap: 5 }}><Icon name="play" size={12} filled />{r.views}</div>}
              </a>
            ))}
          </div>
        </Section>
      )}
      {packages.length > 0 && (
        <Section title="Packages">
          <div className="stack">
            {packages.map((pkg, i) => {
              const { name, desc } = describePackage(pkg);
              return (
                <div key={i} className="card row row--between">
                  <div><b>{name}</b>{desc && <div className="muted small">{desc}</div>}</div>
                  <b className="accent">{formatPrice(pkg.price)}</b>
                </div>
              );
            })}
          </div>
        </Section>
      )}
      <Gallery photos={p.photos} title="Photos" />
      <Section title="Reviews"><CreatorReviews creatorId={p.user_id} isOwnProfile={own} /></Section>
    </>
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

export function ProfileView({ profile: p, own, headerActions, children }: {
  profile: AnyProfile;
  own: boolean;
  /** Buttons beside the name (edit, menu, message…). */
  headerActions?: ReactNode;
  /** Extra sections shown under the header (own-profile tools). */
  children?: ReactNode;
}) {
  const isBrand = p.role === 'brand';
  const picture = isBrand ? (p as BrandProfile).logo_url : (p as InfluencerProfile).avatar_url;
  const cover = (isValidUrl(p.cover_url) && p.cover_url) || (p.photos ?? []).find(isValidUrl) || null;
  const creator = !isBrand ? (p as InfluencerProfile) : null;
  const website = isBrand ? (p as BrandProfile).website : null;

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
          <h1 style={{ fontSize: 28 }}>{p.name || (own ? 'Your Profile' : isBrand ? 'Brand' : 'Creator')} {p.verified && <Verified size={22} />}</h1>
          {(p.categories ?? []).length > 0 && <p className="muted-2">{p.categories.map(categoryLabel).join(', ')}</p>}
          <div className="row wrap muted small" style={{ gap: 14 }}>
            {p.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={15} />{p.location}</span>}
            {creator?.age ? <span>{creator.age} yrs</span> : null}
            {creator?.instagram_handle && (
              <a href={`https://instagram.com/${creator.instagram_handle.replace(/^@/, '')}`} target="_blank" rel="noreferrer">@{creator.instagram_handle.replace(/^@/, '')}</a>
            )}
            {website && <a href={/^https?:\/\//.test(website) ? website : `https://${website}`} target="_blank" rel="noreferrer">{website}</a>}
          </div>
          {p.bio ? <p style={{ whiteSpace: 'pre-wrap' }}>{p.bio}</p> : own && <p className="muted">Add a bio so {isBrand ? 'creators' : 'brands'} know what you do.</p>}
        </div>
      </div>
      {children}
      {isBrand ? <BrandSections p={p as BrandProfile} /> : <CreatorSections p={p as InfluencerProfile} own={own} />}
    </div>
  );
}
