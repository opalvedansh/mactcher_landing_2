import type { Metadata, Viewport } from 'next';
import { Montserrat, Mulish } from 'next/font/google';
import Providers from '@/components/portal/Providers';
import './portal.css';

// The landing page's pairing, so the site and the portal read as one brand.
const display = Montserrat({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display' });
const body = Mulish({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: 'Matchr', template: '%s · Matchr' },
  description: 'Matchr for brands and creators, on the web.',
  robots: { index: false },
};

export const viewport: Viewport = { themeColor: '#0f0f0f', width: 'device-width', initialScale: 1 };

// The portal's own root layout, so the landing page's CSS never reaches it.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
