import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Coopworks — Verified Trades, Worker-Owned',
    template: '%s — Coopworks',
  },
  description:
    'Coopworks connects verified local workers with homes and businesses — fair pay, no middlemen, and every cooperative society run by the workers themselves.',
  metadataBase: new URL('https://coopworks.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://coopworks.vercel.app',
    title: 'Coopworks — Verified Trades, Worker-Owned',
    description:
      'Verified local workers, fair pay, no middlemen. Book a carpenter, plumber, electrician or painter from your cooperative society.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Coopworks — worker-owned cooperative gig platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coopworks — Verified Trades, Worker-Owned',
    description:
      'Verified local workers, fair pay, no middlemen. Book a carpenter, plumber, electrician or painter from your cooperative society.',
    images: ['/og-default.jpg'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint. Only an explicit user
            choice (ft_theme) is honoured — the OS preference is never used, so
            the page can never switch itself to dark behind the user's back.
            suppressHydrationWarning: some browser extensions inject or replace
            <head> scripts before React hydrates; without it that extension
            edit shows up as a spurious hydration-mismatch console error. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ft_theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        {/* Set the HTML lang attribute to match the chosen UI language (en/hi).
            Reads from the same localStorage key as LanguageProvider. Applied
            synchronously before first paint so screen readers and search engines
            see the correct language straight away. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('cw_lang');if(l==='en'||l==='hi'){document.documentElement.lang=l}}catch(e){}})();`,
          }}
        />
        {/* Google Fonts: Outfit & Inter + Material Symbols */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        {/* Telemetry — replace this placeholder with your analytics provider before launch.
            A real snippet (gtag / Plausible / PostHog) must be inserted here, configured to
            respect the site's privacy policy and local law, before traffic is measured. */}
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `window.ANALYTICS_READY = false;`,
          }}
        /> */}
        {/* Safety net: any image loaded over an insecure http:// source would be a mixed-content
            warning on an otherwise HTTPS Vercel deployment. Prefer relative, data: and https://
            sources only; the one external image the app ships (the Google avatar placeholder) is
            loaded over https. */}
      </head>
      <body className="bg-[#FFF9F6] dark:bg-[#0F151D] text-[#0F151D] dark:text-[#FBFBFB] font-sans antialiased selection:bg-[#FF7448] selection:text-white transition-colors duration-200">
        {children}
      </body>
    </html >
  );
}
