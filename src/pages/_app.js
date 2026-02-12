import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Cinzel, Inter } from 'next/font/google';
import { ProfileProvider } from '../context/ProfileContext';
import { ToastProvider } from '../context/ToastContext';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import '../styles/globals.css';
import { supabase } from '../utils/supabase';

// Cinzel for headings - Roman-inspired, authoritative, luxurious
const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Inter for body text - Modern, clean, highly readable
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <style jsx global>{`
        :root {
          --font-heading: ${cinzel.style.fontFamily};
          --font-body: ${inter.style.fontFamily};
        }
        
        html {
          font-family: var(--font-body), system-ui, sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-heading), serif;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        
        /* Special styling for hero headlines */
        .font-display {
          font-family: var(--font-heading), serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
      `}</style>
      <ErrorBoundary>
        <SessionContextProvider
          supabaseClient={supabase}
          initialSession={pageProps.initialSession}
        >
          <ProfileProvider>
            <ToastProvider>
              {getLayout(<Component {...pageProps} />)}
            </ToastProvider>
          </ProfileProvider>
        </SessionContextProvider>
      </ErrorBoundary>
    </>
  );
}

export default MyApp;
