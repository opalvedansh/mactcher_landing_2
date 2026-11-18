'use client';

// Every onboarding step for both roles, ported from mymatcher
// src/screens/onboarding/*. Each step saves the draft as it advances
// (PUT /api/auth/onboarding through the auth context) and the last step
// finishes the account with completeOnboarding().
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/portal/icons';
import { useParams, useRouter } from 'next/navigation';
import { isUsableImage, useAuth, type OnboardingData } from '@/lib/matchr/auth';
import { isStep, nextStep, prevStep, stepProgress } from '@/lib/matchr/onboardingSteps';
import { searchInstagram } from '@/lib/matchr/api';
import { checkDob, formatDob } from '@/lib/matchr/utils/dob';
import { completePackages, draftProblem, toPackageDrafts } from '@/lib/matchr/utils/packages';
import {
  BIO_MAX, BRAND_CATEGORIES, CREATOR_CATEGORIES, GENDERS, MAX_BRAND_CATEGORIES, MAX_CREATOR_CATEGORIES, PLATFORMS,
} from '@/lib/matchr/options';
import { cropToAspect, IMAGE_ACCEPT, pickFile } from '@/lib/matchr/image';
import { LocationPicker, type LocationResult } from '@/components/portal/LocationPicker';
import { PackageEditor } from '@/components/portal/PackageEditor';
import { Spinner } from '@/components/portal/ui';

type Next = (data: Partial<OnboardingData>) => void | Promise<void>;

function Frame({ title, subtitle, onBack, step, role, footer, children }: {
  title: string; subtitle?: string; onBack: () => void; step: string; role: OnboardingData['role'];
  footer: ReactNode; children?: ReactNode;
}) {
  const { index, total } = stepProgress(role, step);
  return (
    <main className="ob">
      <div className="ob__head">
        <button className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="back" /></button>
        <div className="ob__bar grow" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index}>
          <div style={{ width: `${(index / total) * 100}%` }} />
        </div>
      </div>
      <h1 className="ob__title" style={{ whiteSpace: 'pre-line' }}>{title}</h1>
      {subtitle && <p className="ob__subtitle">{subtitle}</p>}
      <div className="ob__body">{children}</div>
      <div className="ob__foot">{footer}</div>
    </main>
  );
}

function NextButton({ disabled, onClick, label = 'Next', busy }: { disabled?: boolean; onClick: () => void; label?: string; busy?: boolean }) {
  return (
    <button className="btn btn--primary btn--block" disabled={disabled || busy} onClick={onClick}>
      {busy ? <Spinner small /> : label}
    </button>
  );
}

function MultiSelect({ options, value, onChange, max }: {
  options: readonly { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; max?: number;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (!max || value.length < max) onChange([...value, id]);
  };
  return (
    <div className="ob__chips">
      {options.map((o) => (
        <button key={o.id} type="button" className="chip" aria-pressed={value.includes(o.id)} onClick={() => toggle(o.id)}>
          <svg className="chip__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SingleChoice<T extends string>({ options, value, onChange, hints }: {
  options: readonly T[]; value: T | null; onChange: (v: T) => void; hints?: Partial<Record<T, string>>;
}) {
  return (
    <div className="stack">
      {options.map((o) => (
        <button key={o} type="button" className="choice" aria-pressed={value === o} onClick={() => onChange(o)}>
          <span className="choice__radio" aria-hidden="true" />
          <span className="grow">
            <b>{o}</b>
            {hints?.[o] && <span className="choice__hint">{hints[o]}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Picks a photo, centre-cropped to `aspect`, as a blob: URL the auth context uploads. */
async function pickPhoto(aspect: number): Promise<string | null> {
  const file = await pickFile(IMAGE_ACCEPT);
  if (!file) return null;
  try {
    return await cropToAspect(file, aspect);
  } catch {
    alert('That image could not be read. Try a JPG or PNG.');
    return null;
  }
}

function PhotoGrid({ photos, onChange, aspect }: { photos: string[]; onChange: (p: string[]) => void; aspect: number }) {
  const pick = async (i: number) => {
    const url = await pickPhoto(aspect);
    if (!url) return;
    const next = [...photos];
    next[i] = url;
    onChange(next.filter(Boolean));
  };
  return (
    <div className="photo-grid">
      {Array.from({ length: 6 }).map((_, i) => {
        const src = photos[i];
        return (
          <div key={i} className="photo-slot" role="button" tabIndex={0} aria-label={src ? `Replace photo ${i + 1}` : 'Add photo'}
            onClick={() => pick(Math.min(i, photos.length))}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick(Math.min(i, photos.length))}>
            {src ? (
              <>
                <img src={src} alt="" />
                <button className="icon-btn" aria-label={`Remove photo ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); onChange(photos.filter((_, j) => j !== i)); }}><Icon name="close" size={14} width={2.6} /></button>
              </>
            ) : <span style={{ fontSize: 28 }}>+</span>}
          </div>
        );
      })}
    </div>
  );
}

function NameStep({ role, data, next, frame }: StepProps) {
  const [name, setName] = useState(data.name ?? '');
  const [ig, setIg] = useState(data.instagramUsername ?? '');
  const [results, setResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  // A saved handle was picked last time; don't reopen suggestions for it.
  const [picked, setPicked] = useState(!!data.instagramUsername);

  useEffect(() => {
    if (picked || ig.replace('@', '').trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    // Replies can land out of order; only the latest query may write results.
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchInstagram(ig.replace('@', '').toLowerCase().trim()).catch(() => []);
      if (cancelled) return;
      setResults(Array.isArray(r) ? r : []);
      setSearching(false);
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [ig, picked]);

  return frame({
    title: `What's your\n${role === 'Brand' ? 'Brand Name' : 'Name'}`,
    subtitle: 'This is what is going to appear on your profile',
    footer: <NextButton disabled={!name.trim()} onClick={() => next({ name, instagramUsername: ig })} />,
    children: (
      <>
        <input className="input" placeholder="Enter" aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && next({ name, instagramUsername: ig })} />
        {role === 'Influencer' && (
          <div className="stack">
            <label className="field"><span>Connect Instagram (Optional)</span>
              <div className="row">
                <input className="input" placeholder="@username" autoCapitalize="none" value={ig}
                  onChange={(e) => { setIg(e.target.value); setPicked(false); }} />
                {searching && <Spinner small />}
              </div>
            </label>
            {results.length > 0 && (
              <div className="suggest">
                {results.slice(0, 6).map((u) => (
                  <button key={u} type="button" onClick={() => { setIg(u); setPicked(true); setResults([]); }}>@{u}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </>
    ),
  });
}

type StepProps = {
  role: OnboardingData['role'];
  data: OnboardingData;
  next: Next;
  frame: (p: { title: string; subtitle?: string; footer: ReactNode; children?: ReactNode }) => JSX.Element;
};

function Step({ step, ...props }: StepProps & { step: string }) {
  const { data, next, frame } = props;
  const [roleChoice, setRoleChoice] = useState<'Brand' | 'Influencer' | null>(data.role);
  const [dob, setDob] = useState(() => formatDob(data.dob ?? ''));
  const [gender, setGender] = useState<(typeof GENDERS)[number] | null>(GENDERS.find((g) => g === data.gender) ?? null);
  const [platforms, setPlatforms] = useState<string[]>(data.platforms ?? []);
  const [categories, setCategories] = useState<string[]>(data.categories ?? []);
  const [location, setLocation] = useState<LocationResult | null>(data.location);
  const [bio, setBio] = useState(data.bio ?? '');
  const [photos, setPhotos] = useState<string[]>(() => (data.photos ?? []).filter(isUsableImage).slice(0, 6));
  const [logo, setLogo] = useState<string | null>(isUsableImage(data.logo) ? data.logo : null);
  const [drafts, setDrafts] = useState(() => toPackageDrafts(data.packages));
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);

  const finish = async (patch: Partial<OnboardingData>) => {
    setBusy(true);
    try {
      await next(patch);
    } finally {
      setBusy(false);
    }
  };

  switch (step) {
    case 'role-selection':
      return frame({
        title: 'How will you\nuse Matchr?',
        subtitle: 'This decides who you see, and who sees you.',
        footer: <NextButton disabled={!roleChoice} onClick={() => next({ role: roleChoice })} />,
        children: (
          <SingleChoice
            options={['Brand', 'Influencer'] as const}
            value={roleChoice}
            onChange={setRoleChoice}
            hints={{ Brand: 'Find creators for your campaigns.', Influencer: 'Get discovered by brands and land collaborations.' }}
          />
        ),
      });
    case 'name-input':
      return <NameStep {...props} />;
    case 'dob-input': {
      const check = checkDob(dob);
      return frame({
        title: "What's your\nDate of Birth",
        subtitle: 'This is what is going to appear on your profile',
        footer: <NextButton disabled={!check.ok} onClick={() => next({ dob })} />,
        children: (
          <>
            <input className="input" placeholder="DD/MM/YYYY" inputMode="numeric" maxLength={10} aria-label="Date of birth" autoFocus
              value={dob} onChange={(e) => setDob((prev) => formatDob(e.target.value, prev))} />
            {!check.ok && check.error && <p className="danger-text small">{check.error}</p>}
          </>
        ),
      });
    }
    case 'gender-input':
      return frame({
        title: "What's your\ngender",
        subtitle: 'Helps us show your profile to the right brands.',
        footer: <NextButton disabled={!gender} onClick={() => next({ gender: gender ?? '' })} />,
        children: <SingleChoice options={GENDERS} value={gender} onChange={setGender} />,
      });
    case 'social-platforms':
    case 'brand-platforms':
      return frame({
        title: step === 'brand-platforms' ? 'Where do you\nupload content?' : 'Where do you\ncreate content?',
        subtitle: 'Select every platform you use.',
        footer: <NextButton disabled={platforms.length === 0} onClick={() => next({ platforms })} />,
        children: <MultiSelect options={PLATFORMS} value={platforms} onChange={setPlatforms} />,
      });
    case 'categories':
      return frame({
        title: 'Choose your\ncategory',
        subtitle: `Choose the content categories that best describe your work. You can select ${MAX_CREATOR_CATEGORIES} maximum`,
        footer: <NextButton disabled={categories.length === 0} onClick={() => next({ categories })} />,
        children: <MultiSelect options={CREATOR_CATEGORIES} value={categories} onChange={setCategories} max={MAX_CREATOR_CATEGORIES} />,
      });
    case 'location':
    case 'brand-location':
      return frame({
        title: 'Where are\nyou based?',
        subtitle: 'Search for your city so we can connect you with nearby partners.',
        footer: <NextButton disabled={!location?.name} onClick={() => location && next({ location })} />,
        children: <LocationPicker value={location} onChange={setLocation} />,
      });
    case 'bio-input':
    case 'brand-bio-input': {
      const count = bio.trim().length;
      return frame({
        title: 'Write about\nyourself',
        subtitle: step === 'bio-input'
          ? 'A small para about yourself that describes you so that brand can know more about you'
          : 'A few lines about your brand, so creators know who they would work with.',
        footer: <NextButton disabled={count === 0 || count > BIO_MAX} onClick={() => next({ bio: bio.trim() })} />,
        children: (
          <>
            <textarea className="textarea" aria-label="Bio" autoFocus value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder={step === 'brand-bio-input' ? 'We make small-batch skincare for people who read the label...' : 'Enter'} />
            <p className={count > BIO_MAX ? 'small danger-text' : 'small muted'} style={{ textAlign: 'right' }}>
              {count > BIO_MAX ? `Trim it to ${BIO_MAX} characters to continue. ` : ''}{count}/{BIO_MAX}
            </p>
          </>
        ),
      });
    }
    case 'photos':
    case 'brand-campaign-upload':
      return frame({
        title: step === 'photos' ? 'Add your\nphotos' : 'Upload your\nbrand campaign',
        subtitle: step === 'photos'
          ? 'Add high-quality photos to increase your chances of matching with brands.'
          : 'Add high-quality posts about your brand that describes about your organization',
        footer: <NextButton disabled={photos.length === 0} onClick={() => next({ photos })} />,
        children: <PhotoGrid photos={photos} onChange={setPhotos} aspect={4 / 5} />,
      });
    case 'brand-logo-upload':
      return frame({
        title: 'Upload your\nbrand logo',
        subtitle: 'Add high-quality logo of your brand',
        footer: <NextButton disabled={!logo} onClick={() => logo && next({ logo })} />,
        children: (
          <div className="photo-slot" style={{ aspectRatio: '1', maxWidth: 260 }} role="button" tabIndex={0} aria-label={logo ? 'Replace logo' : 'Add logo'}
            onClick={async () => { const url = await pickPhoto(1); if (url) setLogo(url); }}>
            {logo ? <img src={logo} alt="Brand logo" /> : <span style={{ fontSize: 28 }}>+</span>}
          </div>
        ),
      });
    case 'brand-categories':
      return frame({
        title: 'Choose your\ncategory',
        subtitle: `You can select ${MAX_BRAND_CATEGORIES} maximum`,
        footer: <NextButton label="Get Started" busy={busy} disabled={categories.length === 0} onClick={() => finish({ categories })} />,
        children: <MultiSelect options={BRAND_CATEGORIES} value={categories} onChange={setCategories} max={MAX_BRAND_CATEGORIES} />,
      });
    case 'price-packages': {
      const packages = completePackages(drafts);
      const missingName = drafts.some((d) => draftProblem(d) === 'name');
      return frame({
        title: 'Set your\npackages',
        subtitle: 'Pick what you offer and set your price for each. Brands see these on your profile.',
        footer: (
          <div className="stack">
            {showErrors && !packages && drafts.length > 0 && (
              <p className="danger-text small">{missingName ? 'Give each custom package a name and a price.' : 'Add a price for each package you picked.'}</p>
            )}
            <NextButton label="Start" busy={busy} disabled={drafts.length === 0}
              onClick={() => (packages ? finish({ packages }) : setShowErrors(true))} />
          </div>
        ),
        children: <PackageEditor drafts={drafts} onChange={setDrafts} showErrors={showErrors} />,
      });
    }
    default:
      return null;
  }
}

export default function OnboardingStepPage() {
  const { step } = useParams<{ step: string }>();
  const router = useRouter();
  const { onboardingData, updateOnboarding, completeOnboarding, signOut } = useAuth();
  // Blocks a double click (or Enter + click) from advancing twice.
  const navigating = useRef(false);
  const data = onboardingData;
  const role = data?.role ?? null;

  // Keep the resume point on the screen actually shown, including after Back.
  useEffect(() => {
    navigating.current = false;
    if (!isStep(step)) {
      router.replace('/app/onboarding/role-selection');
      return;
    }
    const stepName = step.replace(/-/g, '_');
    if (data && data.currentStep !== stepName) updateOnboarding({ currentStep: stepName }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!data || !isStep(step)) return <Spinner screen />;

  const next: Next = async (patch) => {
    if (navigating.current) return;
    navigating.current = true;
    // The role picked on this step decides the branch.
    const after = nextStep((patch.role as OnboardingData['role']) ?? role, step);
    try {
      if (after) {
        await updateOnboarding({ currentStep: after.replace(/-/g, '_'), ...patch });
        router.push(`/app/onboarding/${after}`);
        return;
      }
      // Last step: save it, then create the account. The guard moves them to
      // /app/home once onboardingComplete flips.
      await updateOnboarding({ ...patch, currentStep: step.replace(/-/g, '_') });
      if (await completeOnboarding()) router.replace('/app/home');
      navigating.current = false;
    } catch (e) {
      navigating.current = false;
      throw e;
    }
  };

  const back = () => {
    const prev = prevStep(role, step);
    if (prev) router.push(`/app/onboarding/${prev}`);
    else signOut(); // Back from the first step signs out, as on mobile.
  };

  const frame: StepProps['frame'] = (p) => <Frame {...p} onBack={back} step={step} role={role} />;

  // Keyed by step so each screen starts from the saved draft.
  return <Step key={step} step={step} role={role} data={data} next={next} frame={frame} />;
}
