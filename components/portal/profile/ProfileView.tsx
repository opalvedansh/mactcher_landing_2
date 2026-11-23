'use client';

// Read-only profile for either role, shared by the own-profile and
// public-profile pages. Laid out as mymatcher's InfluencerProfileScreen and
// BrandProfileScreen; the creator screen's analytics tabs are left out because
// every figure in them is a placeholder.
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type { BrandProfile, InfluencerProfile, AnyProfile, PaymentMode, MatchRecord, Responsiveness } from '@/lib/matchr/types';
import { getMatchStats, getMatches, getMyResponsiveness } from '@/lib/matchr/api';
import { compactCount, displayHandle, platformLabel } from '@/lib/matchr/utils/followers';
import { describePackage, type CreatorPackage } from '@/lib/matchr/utils/packages';
import { categoryLabel } from '@/lib/matchr/options';
import { isValidUrl } from '../ProfileCard';
import { Avatar } from '../ui';
import { showAlert } from '../dialogs';
import { CreatorReviews } from './CreatorReviews';
import { BusinessVerifyModal } from './Verify';
import { Icon, MatchrLogo, Verified, type IconName } from '../icons';
import { CompanyLogo, GLYPH, PlatformLogo } from './brandLogos';
import { CampaignIcon, DELIVERABLE_ICON, VibeIcon } from './brandIcons';

const PAYMENT_LABEL: Record<PaymentMode, string> = { bank_transfer: 'Bank transfer', upi: 'UPI', cheque: 'Cheque', paypal: 'PayPal' };
const PACKAGE_ICON: Record<CreatorPackage['type'], IconName> = { story: 'story', reel: 'reel', ugc: 'ugc', brand_collab: 'users', custom: 'star' };

// mymatcher utils/packages formatPrice.
const formatPrice = (price: number) => `₹${String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

// The index of the photo a scroll-snap strip is showing.
const snapIndex = (el: HTMLElement) => Math.round(el.scrollLeft / Math.max(1, el.clientWidth));

type Props = {
  profile: AnyProfile;
  own: boolean;
  /** The Interested / Message button, shown at the bottom as in the app. */
  actions?: ReactNode;
  /** Creator profiles: shows the "Custom package" card; only passed when the viewer can message them. */
  onRequestQuote?: () => void;
  /** Own creator profile: beside the name when not verified (the Get Verified pill). */
  nameExtra?: ReactNode;
  /** Own creator profile: tools under the stats. */
  children?: ReactNode;
  /** Own profile: the "Add …" prompts open the edit sheet. */
  onEdit?: () => void;
  /** Own brand profile: verification updates the profile. */
  onProfileChange?: (p: AnyProfile) => void;
};

function CreatorProfile({ p, own, actions, onRequestQuote, nameExtra, children, onEdit }: Omit<Props, 'profile' | 'onProfileChange'> & { p: InfluencerProfile }) {
  const { scrollY } = useScroll();
  const still = useReducedMotion();
  // The photos scroll at half speed under the panel, as in the app.
  const y = useTransform(scrollY, (v) => (still ? 0 : v / 2));
  const [index, setIndex] = useState(0);

  const avatar = isValidUrl(p.avatar_url) ? p.avatar_url : null;
  const cover = isValidUrl(p.cover_url) ? p.cover_url : null;
  const valid = (p.photos ?? []).filter(isValidUrl);
  const photos = valid.length ? valid : [avatar, cover].filter((u): u is string => !!u);
  const name = p.name || (own ? 'Your Profile' : 'Creator');
  const insta = p.instagram_handle?.replace(/^@/, '');
  const stats = [
    { v: compactCount(p.followers || 0), l: 'Followers' },
    { v: `${Number(p.engagement_rate) || 0}%`, l: 'Engagement' },
    { v: compactCount(p.avg_views || 0), l: 'Avg Views' },
  ];
  const workedWith = p.worked_with ?? [];
  const platforms = p.platforms ?? [];
  const reels = p.reels ?? [];
  const packages = p.packages ?? [];
  const add = own && onEdit;

  return (
    <div className="cp">
      <div className="cp__cover">
        <motion.div className="cp__parallax" style={{ y }}>
          {photos.length > 0 ? (
            <div className="cp__strip" onScroll={(e) => setIndex(snapIndex(e.currentTarget))}>
              {photos.map((src) => <img key={src} src={src} alt="" />)}
            </div>
          ) : (
            <div className="cp__nophoto"><Icon name="image" size={36} /><span>{own ? 'Add a photo in Edit profile' : 'No photos yet'}</span></div>
          )}
        </motion.div>
        <div className="cp__shade" />
        {photos.length > 1 && <div className="cp__bars">{photos.map((src, i) => <span key={src} data-on={i <= index} />)}</div>}
      </div>

      <div className="cp__panel">
        <div className="cp__avatar"><Avatar src={avatar} name={p.name} size={90} /></div>
        <div className="cp__name">
          <h1>{name}{p.age ? `, ${p.age}` : ''}</h1>
          {p.verified ? <Verified size={20} /> : nameExtra}
        </div>
        {insta && (
          <a className="cp__ig" href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer"><i className="fa-brand">{GLYPH.instagram}</i>@{insta}</a>
        )}
        <p className="cp__cats">{(p.categories ?? []).map(categoryLabel).join(', ') || 'Creator'}</p>
        {p.location && <p className="cp__loc"><Icon name="pin" size={13} />{p.location}</p>}
        {p.bio ? <p className="cp__bio">{p.bio}</p> : own && <p className="cp__bio">Add a bio so brands know what you make.</p>}

        <div className="cp__stats">{stats.map((s) => <div key={s.l} className="cp__stat"><b>{s.v}</b><span>{s.l}</span></div>)}</div>

        {children}

        {(workedWith.length > 0 || add) && (
          <section className="cp__group">
            <h2>Worked With</h2>
            {workedWith.length > 0
              ? <div className="cp__logos">{workedWith.map((c) => <CompanyLogo key={c} name={c} />)}</div>
              : <button className="cp__prompt" onClick={onEdit}>Add companies you&apos;ve worked with</button>}
          </section>
        )}

        {(platforms.length > 0 || add) && (
          <section className="cp__group">
            <h2>Available on</h2>
            {platforms.length > 0 ? (
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
            ) : <button className="cp__prompt" onClick={onEdit}>Add the platforms you create on</button>}
          </section>
        )}

        {(reels.length > 0 || add) && (
          <section className="cp__section">
            <h2 className="cp__h">Top Reels</h2>
            <div className="cp__reels">
              {add && <button className="cp__reel cp__reel--add" onClick={onEdit}><span><Icon name="plus" size={28} /></span>Add Reel</button>}
              {reels.map((r) => (
                <a key={r.id} className="cp__reel" href={r.url} target="_blank" rel="noreferrer" aria-label={`Reel${r.views ? `, ${r.views} views` : ''}`}>
                  {r.thumbnail_url ? <img src={r.thumbnail_url} alt="" /> : <span className="cp__reel-empty"><i className="fa-brand">{GLYPH.instagram}</i></span>}
                  {r.views && <span className="cp__reel-views"><Icon name="play" size={10} width={2.4} />{r.views}</span>}
                </a>
              ))}
            </div>
          </section>
        )}

        {(packages.length > 0 || onRequestQuote || add) && (
          <section className="cp__section cp__section--pkgs">
            <h2 className="cp__h cp__h--lg">Packages</h2>
            <div className="cp__pkgs">
              {packages.map((pkg, i) => {
                const { name: pkgName, desc } = describePackage(pkg);
                return (
                  // Custom packages can share a type, so the position keeps keys unique.
                  <div key={`${pkg.type}-${i}`} className="cp__pkg">
                    <span className="cp__pkg-icon"><Icon name={PACKAGE_ICON[pkg.type]} size={28} width={2} /></span>
                    <div className="cp__pkg-body"><b>{pkgName}</b>{desc && <span>{desc}</span>}</div>
                    <span className="cp__pkg-price">{formatPrice(pkg.price)}</span>
                  </div>
                );
              })}
              {add && packages.length === 0 && (
                <button className="cp__pkg cp__pkg--empty" onClick={onEdit}>
                  <div className="cp__pkg-body"><b>Add your packages and prices</b><span>Brands see what you offer and what you charge.</span></div>
                  <span className="cp__pkg-add"><Icon name="plus" size={16} width={2.8} /></span>
                </button>
              )}
              {onRequestQuote && (
                <div className="cp__pkg">
                  <span className="cp__pkg-icon"><span className="cp__plus"><Icon name="plus" size={22} /></span></span>
                  <div className="cp__pkg-body"><b>Custom package</b><span>Have something else in mind?</span></div>
                  <button className="cp__quote" onClick={onRequestQuote}>Request Quote</button>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="cp__reviews">
          <h2 className="cp__h">Reviews</h2>
          <CreatorReviews creatorId={p.user_id} isOwnProfile={own} />
        </section>

        {actions && <div className="profile-cta-wrap">{actions}</div>}
      </div>
    </div>
  );
}

// mymatcher BrandProfileScreen formatCampaignDates: "23nov-23dec".
function formatCampaignDates(days: number) {
  if (!days) return 'Dates TBD';
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + days);
  const formatDt = (d: Date) => `${d.getDate()}${d.toLocaleString('default', { month: 'short' }).toLowerCase()}`;
  return `${formatDt(start)}-${formatDt(end)}`;
}

function formatReplyTime(seconds: number) {
  if (seconds < 60 * 60) return 'Under an hour';
  const hours = Math.round(seconds / 3600);
  if (hours < 24) return `About ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  const days = Math.round(seconds / 86400);
  return `About ${days} ${days === 1 ? 'day' : 'days'}`;
}

const MAX_SHOWN_MATCHES = 5;

function BrandProfile({ p, own, actions, onEdit, onProfileChange }: Omit<Props, 'profile' | 'nameExtra' | 'children' | 'onRequestQuote'> & { p: BrandProfile }) {
  const [index, setIndex] = useState(0);
  const [matches, setMatches] = useState<MatchRecord[] | null>(null);
  const [matchTotal, setMatchTotal] = useState(0);
  const [resp, setResp] = useState<Responsiveness | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!own) return;
    Promise.all([getMatches(), getMatchStats().catch(() => null)])
      .then(([list, s]) => {
        const data = list.data ?? [];
        setMatches(data);
        setMatchTotal(s ? Number(s.total_active) : data.length);
      })
      .catch(() => setMatches([]));
    getMyResponsiveness().then(setResp).catch(() => {});
  }, [own]);

  const cover = isValidUrl(p.cover_url) ? p.cover_url : null;
  const logo = isValidUrl(p.logo_url) ? p.logo_url : null;
  const name = p.name || (own ? 'Your Brand' : 'Brand');
  const platforms = p.platforms ?? [];
  const budgetMin = p.budget_min || 0;
  const budgetMax = p.budget_max || 0;
  const budgetStr = budgetMax > 0 ? `${budgetMin > 0 ? budgetMin / 1000 + 'k-' : ''}${budgetMax / 1000}k` : 'Negotiable';
  const days = p.campaign_days || 0;
  const photos = (p.photos ?? []).filter(isValidUrl);
  const deliverables = ([
    ['reels', p.deliverable_reels ?? 0, 'Reel', 'Reels'],
    ['stories', p.deliverable_stories ?? 0, 'Story', 'Stories'],
    ['posts', p.deliverable_posts ?? 0, 'Post', 'Posts'],
  ] as const).filter(([, n]) => n > 0);
  const payment = p.payment_mode ? PAYMENT_LABEL[p.payment_mode] : null;
  const ratingCount = p.rating_count ?? 0;
  const ratingAvg = p.rating_avg == null ? null : Number(p.rating_avg);
  const status = p.verification_status ?? 'none';
  const shown = (matches ?? []).slice(0, MAX_SHOWN_MATCHES);
  const extra = matchTotal - shown.length;

  return (
    <div className="bp">
      <div className="bp__hero">
        {cover && <img className="bp__cover" src={cover} alt="" />}
        <div className="bp__shade-top" />
        {own && <div className="bp__matchr"><MatchrLogo size={32} /><span>Matchr</span></div>}
        <div className="bp__shade-bottom" />
        <div className="bp__id">
          <span className="bp__logo">{logo ? <img src={logo} alt="" /> : <Icon name="business" size={40} width={1.6} />}</span>
          <div className="bp__id-text">
            <h1>{name}{p.verified && <Verified size={20} />}</h1>
            <p className="bp__cats">{(p.categories ?? []).map(categoryLabel).join(' · ') || 'Uncategorized'}</p>
            <p className="bp__loc"><Icon name="pin" size={14} />{p.location || 'Location not set'}</p>
          </div>
        </div>
      </div>

      {p.bio ? <p className="bp__bio">{p.bio}</p> : own && <p className="bp__bio">Tell creators about your brand...</p>}

      {platforms.length > 0 && (
        <>
          <div className="bp__row"><h2>Active Platforms</h2></div>
          <div className="bp__tags">
            {platforms.map((id) => {
              const count = p.platform_followers?.[id]?.count;
              const glyph = GLYPH[id as keyof typeof GLYPH];
              return (
                <span key={id} className="bp__tag" aria-label={count != null ? `${platformLabel(id)}, ${count} followers` : platformLabel(id)}>
                  {glyph && <i className="fa-brand">{glyph}</i>}
                  {platformLabel(id)}
                  {count != null && <b>{compactCount(count)}</b>}
                </span>
              );
            })}
          </div>
        </>
      )}

      <div className="bp__two">
        <div className="bp__mini">
          <span className="bp__mini-label"><Icon name="wallet" size={18} />Campaign budget</span>
          <b>{budgetStr}</b>
          <span className="bp__mini-sub">per collaboration</span>
        </div>
        <div className="bp__mini">
          <span className="bp__mini-label"><Icon name="calendar" size={18} />Campaign Period</span>
          <b>{formatCampaignDates(days)}</b>
          <span className="bp__mini-sub">{days ? `${days} days` : 'Not set'}</span>
        </div>
      </div>

      {(p.campaign_types ?? []).length > 0 && (
        <div className="bp__card">
          <h3>Campaign type</h3>
          <div className="bp__types">
            {p.campaign_types.map((t) => (
              <span key={t} className="bp__type"><CampaignIcon type={t} size={24} />{t.replace(' ', '\n')}</span>
            ))}
          </div>
        </div>
      )}

      {(p.vibes ?? []).length > 0 && (
        <>
          <div className="bp__row"><h2>Brand vibe</h2></div>
          <div className="bp__vibes">
            {p.vibes.map((v) => <span key={v} className="bp__vibe"><VibeIcon vibe={v} size={22} /><span>{v}</span></span>)}
          </div>
        </>
      )}

      {own && (
        <>
          <div className="bp__row">
            <h2>Matched creators</h2>
            {shown.length > 0 && <Link className="bp__link" href="/app/messages">View all</Link>}
          </div>
          {!matches ? (
            <div className="bp__collab">{[0, 1, 2].map((i) => <span key={i} className="bp__collab-ring bp__collab-ring--skel" />)}</div>
          ) : shown.length === 0 ? (
            <p className="bp__collab bp__note">No matches yet. Creators you match with show up here.</p>
          ) : (
            <Link className="bp__collab" href="/app/messages" aria-label={`${matchTotal} matched ${matchTotal === 1 ? 'creator' : 'creators'}. Opens Messages.`}>
              {shown.map((m) => <span key={m.match_id} className="bp__collab-ring"><Avatar src={m.influencer_avatar} name={m.influencer_name || 'Creator'} size={50} /></span>)}
              {extra > 0 && <span className="bp__collab-ring bp__collab-more">+{extra}</span>}
            </Link>
          )}
        </>
      )}

      <div className="bp__row">
        <h2>Brand campaign</h2>
        {own && <span className="bp__count">{photos.length}/6</span>}
      </div>
      <div className="bp__carousel">
        {photos.length > 0 ? (
          <div className="bp__strip" onScroll={(e) => setIndex(snapIndex(e.currentTarget))}>
            {photos.map((src) => <img key={src} src={src} alt="" />)}
          </div>
        ) : (
          <div className="bp__carousel-empty"><Icon name="image" size={40} /><span>{own ? 'Add photos of your brand campaigns' : 'No campaign photos yet'}</span></div>
        )}
        {photos.length > 1 && (
          <>
            <div className="bp__dots">{photos.map((src, i) => <span key={src} data-on={i === index} />)}</div>
            <span className="bp__arrow"><Icon name="next" size={16} /></span>
          </>
        )}
      </div>

      {deliverables.length > 0 ? (
        <div className="bp__card bp__card--deliv">
          <h3>Deliverables</h3>
          <div className="bp__deliv">
            {deliverables.map(([key, n, one, many]) => (
              <span key={key} className="bp__deliv-item">{DELIVERABLE_ICON[key](28)}{n} {n === 1 ? one : many}</span>
            ))}
          </div>
        </div>
      ) : own && onEdit ? (
        <button className="bp__empty" onClick={onEdit}><Icon name="plus" size={20} />Add the deliverables you ask for</button>
      ) : null}

      {(budgetMin > 0 || budgetMax > 0) && (
        <div className="bp__card">
          <h3>Budget details</h3>
          <div className="bp__split">
            <div>
              <span className="bp__label">Starting from</span>
              <b className="bp__money">{budgetMin > 0 ? `₹${budgetMin.toLocaleString('en-IN')}` : 'Negotiable'}</b>
            </div>
            <i className="bp__divider" />
            <div>
              {payment ? (
                <>
                  <span className="bp__label">Payment</span>
                  <b className="bp__terms">{payment}</b>
                  <span className="bp__terms-sub">{p.payment_days ? `Within ${p.payment_days} days` : 'Timing not stated'}</span>
                </>
              ) : (
                <>
                  <span className="bp__label">Up to</span>
                  <b className="bp__money">{budgetMax > 0 ? `₹${budgetMax.toLocaleString('en-IN')}` : 'Negotiable'}</b>
                </>
              )}
            </div>
          </div>
          {payment && <p className="bp__foot">Terms stated by the brand. Matchr does not hold or release payment.</p>}
        </div>
      )}

      {own && resp && (
        <div className="bp__card">
          <div className="bp__split">
            <div>
              <span className="bp__label">You usually reply</span>
              <b className="bp__reply">{resp.median_reply_seconds != null ? formatReplyTime(resp.median_reply_seconds) : 'Not enough replies yet'}</b>
            </div>
            <i className="bp__divider" />
            <div className="bp__split-end">
              <div>
                <span className="bp__label">Reply rate</span>
                <b className="bp__reply">{resp.response_rate != null ? `${resp.response_rate}%` : '--'}</b>
              </div>
              <span className="bp__accent"><Icon name="flash" size={24} filled /></span>
            </div>
          </div>
          <p className="bp__foot">
            {resp.response_rate != null
              ? `From ${resp.conversations} ${resp.conversations === 1 ? 'conversation' : 'conversations'} creators started. Only you see this.`
              : `Shown once ${resp.min_sample} creators have messaged you. ${resp.conversations} so far.`}
          </p>
        </div>
      )}

      {(ratingCount > 0 || own) && (
        <div className="bp__card">
          <h3>Brand rating</h3>
          {ratingCount > 0 && ratingAvg != null && Number.isFinite(ratingAvg) ? (
            <>
              <div className="bp__score"><span className="bp__accent"><Icon name="star" size={20} filled /></span><b>{ratingAvg.toFixed(1)}</b><span>/5</span></div>
              <span className="bp__label">From {ratingCount} {ratingCount === 1 ? 'creator' : 'creators'} who matched with this brand</span>
            </>
          ) : <p className="bp__note">No ratings yet. Creators can rate you from your chat once you match.</p>}
        </div>
      )}

      {(p.verified || own) && (
        <div className="bp__card">
          <h3>Verification and safety</h3>
          <div className="bp__split">
            <div>
              {p.verified ? (
                <>
                  <span className="bp__verify-head"><span className="bp__accent"><Icon name="shieldCheck" size={18} /></span>Verified business</span>
                  <p className="bp__verify-sub">{p.verification_business_name || 'Checked by Matchr'}</p>
                </>
              ) : status === 'pending' ? (
                <>
                  <span className="bp__verify-head"><Icon name="clock" size={18} />Verification pending</span>
                  <p className="bp__verify-sub">We are checking your details.</p>
                </>
              ) : (
                <>
                  <span className="bp__verify-head"><Icon name="shield" size={18} />Not verified</span>
                  <p className="bp__verify-sub">{status === 'rejected' ? p.verification_note || 'We could not confirm those details.' : 'Creators trust a verified business.'}</p>
                  <button className="bp__verify-btn" onClick={() => setVerifying(true)}>{status === 'rejected' ? 'Try again' : 'Get verified'}</button>
                </>
              )}
            </div>
            <i className="bp__divider" />
            <div>
              <span className="bp__verify-head"><Icon name="lock" size={18} />Your privacy</span>
              <p className="bp__verify-sub">Your exact location and email stay hidden. Anyone can be blocked or reported.</p>
            </div>
          </div>
        </div>
      )}

      {actions && <div className="profile-cta-wrap">{actions}</div>}

      {verifying && (
        <BusinessVerifyModal onClose={() => setVerifying(false)} onSubmitted={(r) => {
          setVerifying(false);
          onProfileChange?.({ ...p, ...r });
          showAlert('Request sent', 'We are checking your details. The badge appears once they are confirmed.');
        }} />
      )}
    </div>
  );
}

export function ProfileView({ profile, ...rest }: Props) {
  return profile.role === 'brand'
    ? <BrandProfile p={profile as BrandProfile} {...rest} />
    : <CreatorProfile p={profile as InfluencerProfile} {...rest} />;
}
