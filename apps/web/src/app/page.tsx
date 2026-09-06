'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

// Dynamically import App with SSR disabled (uses browser APIs: localStorage, navigator.geolocation)
const App = dynamic(() => import('@/App'), { ssr: false });

export default function Home() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  );
}
