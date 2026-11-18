'use client';

// Ported from mymatcher src/components/PackagePriceEditor.tsx.
import {
  CUSTOM_DESC_MAX, CUSTOM_NAME_MAX, MAX_CUSTOM_PACKAGES, PACKAGE_OPTIONS,
  draftId, draftProblem, isCustomDraft, newCustomDraft, orderDrafts,
  type CustomDraft, type PackageDraft, type PackageType,
} from '@/lib/matchr/utils/packages';
import { Icon } from './icons';

export function PackageEditor({ drafts, onChange, showErrors }: {
  drafts: PackageDraft[];
  onChange: (next: PackageDraft[]) => void;
  /** Mark picked packages that still have no price (or, if custom, no name). */
  showErrors?: boolean;
}) {
  const customs = drafts.filter(isCustomDraft);

  const toggle = (type: PackageType) =>
    onChange(drafts.some((d) => d.type === type)
      ? drafts.filter((d) => d.type !== type)
      : orderDrafts([...drafts, { type, price: null }]));

  const update = (id: string, patch: Partial<CustomDraft>) =>
    onChange(drafts.map((d) => (draftId(d) === id ? ({ ...d, ...patch } as PackageDraft) : d)));

  const setPrice = (id: string, text: string) => {
    const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, 8);
    update(id, { price: digits ? Number(digits) : null });
  };

  const priceInput = (draft: PackageDraft, label: string) => (
    <label className="field">
      <span>Price (₹)</span>
      <input
        className="input" inputMode="numeric" placeholder="Your price" aria-label={`${label} price in rupees`}
        style={showErrors && draftProblem(draft) === 'price' ? { borderColor: 'var(--danger)' } : undefined}
        value={draft.price == null ? '' : String(draft.price)}
        onChange={(e) => setPrice(draftId(draft), e.target.value)}
      />
    </label>
  );

  return (
    <div className="stack">
      {PACKAGE_OPTIONS.map((o) => {
        const draft = drafts.find((d) => d.type === o.type);
        return (
          <div key={o.type} className="stack" style={{ gap: 8 }}>
            <button type="button" className="choice" aria-pressed={!!draft} onClick={() => toggle(o.type)}>
              <div className="grow">
                <b>{o.name}</b>
                <div className="muted small">{o.desc}</div>
              </div>
              <Icon name={draft ? 'check' : 'plus'} />
            </button>
            {draft && priceInput(draft, o.name)}
          </div>
        );
      })}
      {customs.map((d) => {
        const label = d.name.trim() || 'Custom package';
        return (
          <div key={d.key} className="card stack">
            <div className="row row--between">
              <b>{label}</b>
              <button type="button" className="icon-btn" aria-label={`Remove ${label}`} onClick={() => onChange(drafts.filter((x) => draftId(x) !== d.key))}><Icon name="close" size={16} /></button>
            </div>
            <input
              className="input" placeholder="Package name, e.g. YouTube video" aria-label="Package name" maxLength={CUSTOM_NAME_MAX}
              style={showErrors && draftProblem(d) === 'name' ? { borderColor: 'var(--danger)' } : undefined}
              value={d.name} onChange={(e) => update(d.key, { name: e.target.value })} autoFocus={!d.name}
            />
            <input
              className="input" placeholder="What's included (optional)" aria-label="Package description" maxLength={CUSTOM_DESC_MAX}
              value={d.desc} onChange={(e) => update(d.key, { desc: e.target.value })}
            />
            {priceInput(d, label)}
          </div>
        );
      })}
      {customs.length < MAX_CUSTOM_PACKAGES && (
        <button type="button" className="btn btn--outline" onClick={() => onChange([...drafts, newCustomDraft()])}>
          + Add your own package
        </button>
      )}
    </div>
  );
}
