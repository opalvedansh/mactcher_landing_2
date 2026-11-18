// Option lists copied from the mymatcher onboarding screens, so web and mobile
// write the same values.

/** src/screens/onboarding/{influencer/SocialPlatform,brand/BrandPlatform}SelectionScreen.tsx */
export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'x', label: 'X' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'threads', label: 'Threads' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'discord', label: 'Discord' },
  { id: 'behance', label: 'Behance' },
  { id: 'dribbble', label: 'Dribbble' },
] as const;

/** src/screens/onboarding/influencer/CategorySelectionScreen.tsx (max 10) */
export const CREATOR_CATEGORIES = [
  'Lifestyle', 'Fashion', 'Clothing & Apparel', 'Beauty', 'Fitness',
  'Food', 'Travel', 'Tech', 'Gaming',
  'Finance', 'Business', 'Education', 'Comedy',
  'Photography', 'Music', 'Automotive', 'Luxury',
  'Pets', 'Sustainability', 'Reviews', 'UGC',
  'Art', 'Spirituality', 'Vlogs', 'Events',
].map((c) => ({ id: c, label: c }));
export const MAX_CREATOR_CATEGORIES = 10;

/** src/screens/onboarding/brand/BrandCategorySelectionScreen.tsx (max 6) */
export const BRAND_CATEGORIES = [
  { id: 'retail', label: 'Retail & Consumer' },
  { id: 'apparel', label: 'Clothing & Apparel' },
  { id: 'food', label: 'Food & Beverage' },
  { id: 'tech', label: 'Technology' },
  { id: 'auto', label: 'Automotive' },
  { id: 'health', label: 'Health & Wellness' },
  { id: 'edu', label: 'Education' },
  { id: 'finance', label: 'Finance' },
  { id: 'travel', label: 'Travel' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'business', label: 'Business' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'other', label: 'Other' },
];
export const MAX_BRAND_CATEGORIES = 6;

export const GENDERS = ['Male', 'Female', 'Other'] as const;

/** Display label for a stored category id (brand ids are short codes). */
export const categoryLabel = (id: string) => BRAND_CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** Max characters of a bio, both roles. */
export const BIO_MAX = 250;
