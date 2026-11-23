'use client';

// The creator profile's per-section editors (mymatcher InfluencerProfileScreen
// EditWorkedWithModal, the Available On sheet and EditPackagesModal). Each one
// saves only its own fields, with the app's payloads.
import { useState, type ReactNode } from 'react';
import type { AnyProfile, InfluencerProfile, ProfileUpdate } from '@/lib/matchr/types';
import { updateMyProfile } from '@/lib/matchr/api';
import { PLATFORMS } from '@/lib/matchr/options';
import { followerDrafts, handleDrafts, typedFollowers, typedHandles } from '@/lib/matchr/utils/followers';
import { completePackages, toPackageDrafts } from '@/lib/matchr/utils/packages';
import { PackageEditor } from '../PackageEditor';
import { Modal, Spinner, errorText } from '../ui';
import { showAlert } from '../dialogs';
import { COMPANIES, CompanyLogo, PlatformLogo } from './brandLogos';
import { PlatformFollowerRows } from './EditProfile';

export type SectionKey = 'worked' | 'platforms' | 'packages';

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function Sheet({ title, subtitle, saving, onSave, onClose, children }: {
  title: string; subtitle: string; saving: boolean; onSave: () => void; onClose: () => void; children: ReactNode;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="qe-sub">{subtitle}</p>
      {children}
      <button className="qe-save" disabled={saving} onClick={onSave}>{saving ? <Spinner small /> : 'Save'}</button>
    </Modal>
  );
}

export function SectionEditor({ section, profile, onClose, onSaved }: {
  section: SectionKey; profile: InfluencerProfile; onClose: () => void; onSaved: (p: AnyProfile) => void;
}) {
  const [saving, setSaving] = useState(false);
  // Every platform gets a draft, so toggling one off and on keeps its count.
  const allPlatforms = [...new Set([...PLATFORMS.map((p) => p.id), ...(profile.platforms ?? [])])];
  const [worked, setWorked] = useState<string[]>(profile.worked_with ?? []);
  const [newCompany, setNewCompany] = useState('');
  const [platforms, setPlatforms] = useState<string[]>((profile.platforms ?? []).map((p) => p.toLowerCase()));
  const [followers, setFollowers] = useState(() => followerDrafts(profile.platform_followers, allPlatforms));
  const [handles, setHandles] = useState(() => handleDrafts(profile.platform_handles, allPlatforms));
  const [drafts, setDrafts] = useState(() => toPackageDrafts(profile.packages));
  const [showErrors, setShowErrors] = useState(false);

  // Throws nothing: on failure the sheet stays open with the edits, as in the app.
  const save = async (body: ProfileUpdate) => {
    setSaving(true);
    try {
      onSaved(await updateMyProfile(body));
      onClose();
    } catch (e) {
      showAlert('Could not save', errorText(e, 'Check your connection and try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (section === 'worked') {
    // Catalog brands first, then any custom companies saved or just added.
    const options = [
      ...COMPANIES.map((c) => c.name),
      ...[...(profile.worked_with ?? []), ...worked].filter((c, i, all) =>
        !COMPANIES.some((k) => same(k.name, c)) && all.findIndex((o) => same(o, c)) === i),
    ];
    const toggle = (company: string) => setWorked((prev) => (prev.some((c) => same(c, company)) ? prev.filter((c) => !same(c, company)) : [...prev, company]));
    const add = () => {
      const typed = newCompany.trim();
      if (!typed) return;
      // The catalog spelling when the typed name is a known brand.
      const name = COMPANIES.find((c) => same(c.name, typed))?.name ?? typed;
      setWorked((prev) => (prev.some((c) => same(c, name)) ? prev : [...prev, name]));
      setNewCompany('');
    };
    return (
      <Sheet title="Worked With" subtitle="Select the brands you have collaborated with." saving={saving} onClose={onClose} onSave={() => save({ worked_with: worked })}>
        <div className="qe-chips qe-chips--scroll">
          {options.map((company) => (
            <button key={company} type="button" className="qe-chip" aria-pressed={worked.some((c) => same(c, company))} onClick={() => toggle(company)}>
              <CompanyLogo name={company} />{company}
            </button>
          ))}
        </div>
        <form className="qe-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <input className="input" placeholder="Another company" maxLength={60} value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
          <button type="submit" className="qe-add__btn">Add</button>
        </form>
      </Sheet>
    );
  }

  if (section === 'platforms') {
    const toggle = (id: string) => setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    return (
      <Sheet title="Available On" subtitle="Select the platforms where brands can work with you, and how many followers you have on each." saving={saving} onClose={onClose}
        onSave={() => save({
          platforms,
          platform_followers: typedFollowers(followers, profile.platform_followers, platforms),
          // Instagram has its own sync (the handle under the name).
          platform_handles: typedHandles(handles, platforms.filter((p) => p !== 'instagram')),
        })}>
        <div className="qe-chips">
          {PLATFORMS.map((p) => (
            <button key={p.id} type="button" className="qe-chip" aria-pressed={platforms.includes(p.id)} onClick={() => toggle(p.id)}>
              <PlatformLogo id={p.id} />{p.label}
            </button>
          ))}
        </div>
        {platforms.length > 0 && (
          <div className="stack qe-followers">
            <b className="qe-label">Followers</b>
            <p className="qe-hint">Add your account and we&apos;ll fetch your follower count, usually within a few minutes. You can type it yourself in the meantime.</p>
            <PlatformFollowerRows profile={profile} platforms={platforms} followers={followers} setFollowers={setFollowers} handles={handles} setHandles={setHandles} />
          </div>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Packages" subtitle="Pick what you offer and set your price for each. Brands see these on your profile." saving={saving} onClose={onClose}
      onSave={() => {
        // Removing every package is allowed; brands then just don't see the section.
        const next = drafts.length === 0 ? [] : completePackages(drafts);
        if (!next) return setShowErrors(true);
        save({ packages: next });
      }}>
      <PackageEditor drafts={drafts} onChange={setDrafts} showErrors={showErrors} />
    </Sheet>
  );
}
