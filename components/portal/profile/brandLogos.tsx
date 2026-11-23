// Brand logos for a creator's profile, drawn with the font the mobile app
// uses for them (Font Awesome 6 Free Brands, SIL OFL 1.1, in public/fonts).
// Colours and the company list follow mymatcher InfluencerProfileScreen.
import { Icon } from '../icons';

export const GLYPH = {
  instagram: '', youtube: '', tiktok: '', x: '', twitter: '', reddit: '',
  pinterest: '', facebook: '', linkedin: '', snapchat: '', threads: '',
  spotify: '', twitch: '', discord: '', behance: '', dribbble: '',
  apple: '', google: '', amazon: '', microsoft: '', meta: '', uber: '',
  airbnb: '', shopify: '', playstation: '', paypal: '',
} as const;

const PLATFORM_BG: Record<string, string> = {
  instagram: 'linear-gradient(45deg, #f9ce34, #ee2a7b 50%, #6228d7)', youtube: '#FF0000', tiktok: '#000000',
  x: '#000000', twitter: '#1DA1F2', reddit: '#FF4500', pinterest: '#E60023', facebook: '#1877F2',
  linkedin: '#0A66C2', snapchat: '#FFFC00', threads: '#000000', spotify: '#1DB954', twitch: '#9146FF',
  discord: '#5865F2', behance: '#1769FF', dribbble: '#EA4C89',
};

export function PlatformLogo({ id }: { id: string }) {
  const glyph = GLYPH[id as keyof typeof GLYPH];
  return (
    <span className="cp__circle" style={{ background: PLATFORM_BG[id] ?? 'var(--accent)', color: id === 'snapchat' ? '#000' : '#fff' }}>
      {glyph && PLATFORM_BG[id] ? <i className="fa-brand">{glyph}</i> : <Icon name="star" size={18} filled />}
    </span>
  );
}

export const COMPANIES: { name: string; icon?: keyof typeof GLYPH; color: string }[] = [
  { name: 'Nike', color: '#111111' }, { name: 'Adidas', color: '#000000' }, { name: 'Puma', color: '#1A1A1A' },
  { name: 'Apple', icon: 'apple', color: '#000000' }, { name: 'Samsung', color: '#1428A0' },
  { name: 'Google', icon: 'google', color: '#4285F4' }, { name: 'Amazon', icon: 'amazon', color: '#FF9900' },
  { name: 'Microsoft', icon: 'microsoft', color: '#00A4EF' }, { name: 'Meta', icon: 'meta', color: '#0866FF' },
  { name: 'Flipkart', color: '#2874F0' }, { name: 'Myntra', color: '#FF3F6C' }, { name: 'Nykaa', color: '#FC2779' },
  { name: 'Mamaearth', color: '#00AEEF' }, { name: 'boAt', color: '#E4002B' }, { name: 'Zomato', color: '#E23744' },
  { name: 'Swiggy', color: '#FC8019' }, { name: 'Netflix', color: '#E50914' },
  { name: 'Spotify', icon: 'spotify', color: '#1DB954' }, { name: 'Coca-Cola', color: '#F40009' },
  { name: 'Pepsi', color: '#004B93' }, { name: 'Red Bull', color: '#DB0A40' }, { name: 'Uber', icon: 'uber', color: '#000000' },
  { name: 'Airbnb', icon: 'airbnb', color: '#FF5A5F' }, { name: 'Shopify', icon: 'shopify', color: '#96BF48' },
  { name: 'PlayStation', icon: 'playstation', color: '#003791' }, { name: 'PayPal', icon: 'paypal', color: '#003087' },
  { name: 'Zara', color: '#000000' }, { name: 'H&M', color: '#E50010' }, { name: 'OnePlus', color: '#EB0028' },
  { name: 'Sugar Cosmetics', color: '#000000' },
];

// Whole-word match, as in the app, so "Apple India" finds Apple but "Metal Co" is not Meta.
function findCompany(company: string) {
  const lower = company.trim().toLowerCase();
  return COMPANIES.find((c) => c.name.toLowerCase() === lower)
    ?? COMPANIES.find((c) => ` ${lower} `.includes(` ${c.name.toLowerCase()} `));
}

/** A company the creator worked with, on a white disc as in the design. */
export function CompanyLogo({ name }: { name: string }) {
  const known = findCompany(name);
  return (
    <span className="cp__circle cp__circle--white" style={{ color: known?.color ?? 'var(--accent)' }} title={name} role="img" aria-label={name}>
      {known?.icon ? <i className="fa-brand">{GLYPH[known.icon]}</i> : <b className="cp__initials">{name.trim().slice(0, 2).toUpperCase()}</b>}
    </span>
  );
}
