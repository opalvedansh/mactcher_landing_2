'use client';

// One edit form for everything PUT /api/profiles/me accepts, per role. The
// mobile app spreads these over several sheets; the fields and the payloads
// are the same (see Brand/InfluencerProfileScreen.tsx save handlers).
import { useState } from 'react';
import type { AnyProfile, BrandProfile, InfluencerProfile, PaymentMode, ProfileUpdate } from '@/lib/matchr/types';
import { updateMyProfile, uploadImage } from '@/lib/matchr/api';
import { cropToAspect, IMAGE_ACCEPT, pickFile } from '@/lib/matchr/image';
import { BRAND_CATEGORIES, CREATOR_CATEGORIES, GENDERS, MAX_BRAND_CATEGORIES, MAX_CREATOR_CATEGORIES, PLATFORMS } from '@/lib/matchr/options';
import { HANDLE_PLACEHOLDERS, followerDrafts, handleDrafts, isSyncedCount, platformLabel, typedFollowers, typedHandles } from '@/lib/matchr/utils/followers';
import { completePackages, toPackageDrafts } from '@/lib/matchr/utils/packages';
import { LocationPicker, type LocationResult } from '../LocationPicker';
import { PackageEditor } from '../PackageEditor';
import { Modal, Spinner, errorText } from '../ui';
import { Icon } from '../icons';

// From mymatcher BrandProfileScreen.tsx (brands set these on their profile).
const CAMPAIGN_TYPES = ['Paid Collaboration', 'Product Review', 'UGC Campaign', 'Brand Ambassador', 'Event Coverage'];
const VIBES = ['Premium', 'Minimal', 'Bold', 'Authentic', 'Genz'];
const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank transfer' }, { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' }, { value: 'paypal', label: 'PayPal' },
];

const withSaved = (catalogue: string[], saved: string[] = []) => [...catalogue, ...saved.filter((v) => !catalogue.includes(v))];
const toggle = (list: string[], v: string, max?: number) =>
  list.includes(v) ? list.filter((x) => x !== v) : max && list.length >= max ? list : [...list, v];
const int = (s: string) => (s.trim() === '' ? undefined : Math.max(0, Math.trunc(Number(s.replace(/\D/g, '')))));

function Chips({ options, value, onChange, max }: { options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="row wrap">
      {options.map((o) => <button type="button" key={o.id} className="chip" aria-pressed={value.includes(o.id)} onClick={() => onChange(toggle(value, o.id, max))}>{o.label}</button>)}
    </div>
  );
}

/** A photo slot that picks, crops and keeps a blob: URL until save uploads it. */
function ImageField({ label, value, onChange, aspect }: { label: string; value: string | null; onChange: (v: string) => void; aspect: number }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="row">
        <div className="photo-slot" style={{ width: 96, aspectRatio: String(aspect) }} role="button" tabIndex={0} aria-label={`Choose ${label.toLowerCase()}`}
          onClick={async () => { const f = await pickFile(IMAGE_ACCEPT); if (f) onChange(await cropToAspect(f, aspect)); }}>
          {value ? <img src={value} alt="" /> : '+'}
        </div>
      </div>
    </div>
  );
}

/** Uploads a blob: URL picked in this form; anything else is already a public URL. */
const resolve = async (url: string) => (url.startsWith('blob:') ? uploadImage(await fetch(url).then((r) => r.blob())) : url);

export function EditProfile({ profile, onClose, onSaved }: { profile: AnyProfile; onClose: () => void; onSaved: (p: AnyProfile) => void }) {
  const isBrand = profile.role === 'brand';
  const b = profile as BrandProfile;
  const c = profile as InfluencerProfile;

  const [name, setName] = useState(profile.name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [location, setLocation] = useState<LocationResult | null>(profile.location ? { name: profile.location, lat: profile.lat ?? 0, lng: profile.lng ?? 0 } : null);
  const [categories, setCategories] = useState<string[]>(profile.categories ?? []);
  const [platforms, setPlatforms] = useState<string[]>(profile.platforms ?? []);
  const [followers, setFollowers] = useState(() => followerDrafts(profile.platform_followers, PLATFORMS.map((p) => p.id)));
  const [handles, setHandles] = useState(() => handleDrafts(profile.platform_handles, PLATFORMS.map((p) => p.id)));
  const [picture, setPicture] = useState<string | null>((isBrand ? b.logo_url : c.avatar_url) ?? null);
  const [cover, setCover] = useState<string | null>(profile.cover_url ?? null);
  const [photos, setPhotos] = useState<string[]>(profile.photos ?? []);
  // Brand
  const [website, setWebsite] = useState(b.website ?? '');
  const [budgetMin, setBudgetMin] = useState(b.budget_min ? String(b.budget_min) : '');
  const [budgetMax, setBudgetMax] = useState(b.budget_max ? String(b.budget_max) : '');
  const [campaignDays, setCampaignDays] = useState(b.campaign_days ? String(b.campaign_days) : '');
  const [reelsN, setReelsN] = useState(String(b.deliverable_reels ?? 0));
  const [storiesN, setStoriesN] = useState(String(b.deliverable_stories ?? 0));
  const [postsN, setPostsN] = useState(String(b.deliverable_posts ?? 0));
  const [paymentMode, setPaymentMode] = useState<PaymentMode | ''>(b.payment_mode ?? '');
  const [paymentDays, setPaymentDays] = useState(b.payment_days ? String(b.payment_days) : '');
  const [campaignTypes, setCampaignTypes] = useState<string[]>(b.campaign_types ?? []);
  const [vibes, setVibes] = useState<string[]>(b.vibes ?? []);
  // Creator
  const [gender, setGender] = useState(c.gender ?? '');
  const [instagram, setInstagram] = useState(c.instagram_handle ?? '');
  const [workedWith, setWorkedWith] = useState((c.worked_with ?? []).join(', '));
  const [reels, setReels] = useState(c.reels ?? []);
  const [newReel, setNewReel] = useState('');
  const [packages, setPackages] = useState(() => toPackageDrafts(c.packages));
  const [showErrors, setShowErrors] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    if (!name.trim()) return setError('Add a name.');
    const pkgs = isBrand ? null : completePackages(packages);
    if (!isBrand && packages.length && !pkgs) {
      setShowErrors(true);
      return setError('Give each package a price (and each custom package a name).');
    }
    if (isBrand && int(budgetMin) && int(budgetMax) && int(budgetMin)! > int(budgetMax)!) return setError('The minimum budget is above the maximum.');
    setSaving(true);
    try {
      const [pic, cov, gallery] = await Promise.all([
        picture ? resolve(picture) : Promise.resolve(''),
        cover ? resolve(cover) : Promise.resolve(''),
        Promise.all(photos.map(resolve)),
      ]);
      const shared = {
        name: name.trim(),
        bio: bio.trim(),
        categories,
        platforms,
        photos: gallery,
        ...(cov ? { cover_url: cov } : {}),
        platform_followers: typedFollowers(followers, profile.platform_followers, platforms),
        ...(location ? { location: location.name, lat: location.lat, lng: location.lng } : {}),
      };
      const body: ProfileUpdate = isBrand
        ? {
          ...shared,
          ...(pic ? { logo_url: pic } : {}),
          website: website.trim(),
          platform_handles: typedHandles(handles, platforms),
          budget_min: int(budgetMin) ?? 0,
          budget_max: int(budgetMax) ?? 0,
          campaign_days: Math.min(int(campaignDays) ?? 0, 365),
          deliverable_reels: Math.min(int(reelsN) ?? 0, 99),
          deliverable_stories: Math.min(int(storiesN) ?? 0, 99),
          deliverable_posts: Math.min(int(postsN) ?? 0, 99),
          payment_mode: paymentMode,
          payment_days: Math.min(int(paymentDays) ?? 0, 90),
          campaign_types: campaignTypes,
          vibes,
        }
        : {
          ...shared,
          ...(pic ? { avatar_url: pic } : {}),
          gender: gender || undefined,
          // Instagram has its own sync (the handle below the name).
          platform_handles: typedHandles(handles, platforms.filter((p) => p !== 'instagram')),
          instagram_handle: instagram.replace(/^@/, '').trim().toLowerCase(),
          worked_with: workedWith.split(',').map((s) => s.trim()).filter(Boolean),
          reels,
          packages: pkgs ?? [],
        };
      onSaved(await updateMyProfile(body));
    } catch (e) {
      setError(errorText(e, 'Could not save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit profile" onClose={onClose} wide>
      <div className="stack">
        <ImageField label={isBrand ? 'Logo' : 'Profile photo'} value={picture} onChange={setPicture} aspect={1} />
        <ImageField label="Cover" value={cover} onChange={setCover} aspect={16 / 9} />
        <label className="field"><span>{isBrand ? 'Brand name' : 'Name'}</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>Bio</span><textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} /></label>
        <div className="field"><span>Location</span><LocationPicker value={location} onChange={setLocation} /></div>
        {isBrand && <label className="field"><span>Website</span><input className="input" inputMode="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourbrand.com" /></label>}
        {!isBrand && (
          <>
            <div className="field"><span>Gender</span><Chips options={GENDERS.map((g) => ({ id: g, label: g }))} value={gender ? [gender] : []} onChange={(v) => setGender(v.find((x) => x !== gender) ?? '')} /></div>
            <label className="field"><span>Instagram username</span><input className="input" placeholder="@username" value={instagram} onChange={(e) => setInstagram(e.target.value)} /></label>
          </>
        )}

        <div className="field">
          <span>Categories (up to {isBrand ? MAX_BRAND_CATEGORIES : MAX_CREATOR_CATEGORIES})</span>
          <Chips options={isBrand ? BRAND_CATEGORIES : CREATOR_CATEGORIES} value={categories} onChange={setCategories} max={isBrand ? MAX_BRAND_CATEGORIES : MAX_CREATOR_CATEGORIES} />
        </div>

        <div className="field">
          <span>Platforms</span>
          <Chips options={PLATFORMS.map((p) => ({ id: p.id, label: p.label }))} value={platforms} onChange={setPlatforms} />
        </div>
        {platforms.map((p) => (
          <div key={p} className="row wrap" style={{ alignItems: 'flex-end' }}>
            <label className="field grow"><span>{platformLabel(p)} followers</span>
              {isSyncedCount(profile.platform_followers, p)
                ? <input className="input" disabled value={`${profile.platform_followers![p].count} (fetched)`} />
                : <input className="input" inputMode="numeric" value={followers[p] ?? ''} onChange={(e) => setFollowers({ ...followers, [p]: e.target.value.replace(/\D/g, '') })} />}
            </label>
            {(isBrand || p !== 'instagram') && (
              <label className="field grow"><span>{platformLabel(p)} account</span>
                <input className="input" placeholder={HANDLE_PLACEHOLDERS[p] ?? 'Username or link'} value={handles[p] ?? ''} onChange={(e) => setHandles({ ...handles, [p]: e.target.value })} />
              </label>
            )}
          </div>
        ))}

        {isBrand ? (
          <>
            <div className="row wrap">
              <label className="field grow"><span>Budget from (₹)</span><input className="input" inputMode="numeric" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value.replace(/\D/g, ''))} /></label>
              <label className="field grow"><span>Budget up to (₹)</span><input className="input" inputMode="numeric" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value.replace(/\D/g, ''))} /></label>
              <label className="field grow"><span>Campaign period (days)</span><input className="input" inputMode="numeric" value={campaignDays} onChange={(e) => setCampaignDays(e.target.value.replace(/\D/g, ''))} /></label>
            </div>
            <div className="row wrap">
              <label className="field grow"><span>Reels</span><input className="input" inputMode="numeric" value={reelsN} onChange={(e) => setReelsN(e.target.value.replace(/\D/g, ''))} /></label>
              <label className="field grow"><span>Stories</span><input className="input" inputMode="numeric" value={storiesN} onChange={(e) => setStoriesN(e.target.value.replace(/\D/g, ''))} /></label>
              <label className="field grow"><span>Posts</span><input className="input" inputMode="numeric" value={postsN} onChange={(e) => setPostsN(e.target.value.replace(/\D/g, ''))} /></label>
            </div>
            <div className="row wrap">
              <label className="field grow"><span>Payment</span>
                <select className="select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode | '')}>
                  <option value="">Not stated</option>
                  {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
              <label className="field grow"><span>Pay within (days)</span><input className="input" inputMode="numeric" value={paymentDays} onChange={(e) => setPaymentDays(e.target.value.replace(/\D/g, ''))} /></label>
            </div>
            <p className="small muted">Payment terms are yours to state. Matchr does not hold or guarantee payment.</p>
            <div className="field"><span>Campaign types</span><Chips options={withSaved(CAMPAIGN_TYPES, b.campaign_types).map((t) => ({ id: t, label: t }))} value={campaignTypes} onChange={setCampaignTypes} /></div>
            <div className="field"><span>Brand vibe</span><Chips options={withSaved(VIBES, b.vibes).map((t) => ({ id: t, label: t }))} value={vibes} onChange={setVibes} /></div>
          </>
        ) : (
          <>
            <label className="field"><span>Brands you have worked with (comma separated)</span><input className="input" value={workedWith} onChange={(e) => setWorkedWith(e.target.value)} /></label>
            <div className="field">
              <span>Top reels</span>
              {reels.map((r) => (
                <div key={r.id} className="row">
                  <a className="grow ellipsis small" href={r.url} target="_blank" rel="noreferrer">{r.url}</a>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReels(reels.filter((x) => x.id !== r.id))}>Remove</button>
                </div>
              ))}
              <div className="row">
                <input className="input" placeholder="Paste an Instagram reel link" value={newReel} onChange={(e) => setNewReel(e.target.value)} />
                <button type="button" className="btn btn--outline btn--sm" disabled={!newReel.trim()}
                  onClick={() => { setReels([{ id: Math.random().toString(36).slice(2, 9), url: newReel.trim(), views: '0' }, ...reels]); setNewReel(''); }}>Add</button>
              </div>
            </div>
            <div className="field"><span>Packages</span><PackageEditor drafts={packages} onChange={setPackages} showErrors={showErrors} /></div>
          </>
        )}

        <div className="field">
          <span>{isBrand ? 'Campaign photos' : 'Photos'}</span>
          <div className="photo-grid">
            {photos.map((src, i) => (
              <div key={src} className="photo-slot">
                <img src={src} alt="" />
                <button type="button" className="icon-btn" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}><Icon name="close" size={14} width={2.6} /></button>
              </div>
            ))}
            {photos.length < 6 && (
              <button type="button" className="photo-slot" onClick={async () => { const f = await pickFile(IMAGE_ACCEPT); if (f) setPhotos([...photos, await cropToAspect(f, 4 / 5)]); }}>+</button>
            )}
          </div>
        </div>

        {error && <div className="alert" role="alert">{error}</div>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" disabled={saving} onClick={save}>{saving ? <Spinner small /> : 'Save'}</button>
        </div>
      </div>
    </Modal>
  );
}
