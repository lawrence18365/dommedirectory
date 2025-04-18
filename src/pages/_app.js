import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Playfair_Display } from 'next/font/google'; // Import the font
import { ProfileProvider } from '../context/ProfileContext'; // Import ProfileProvider
import '../styles/globals.css';
import { supabase } from '../utils/supabase'; // Import the single client instance

// Configure the font
const playfair = Playfair_Display({
  subsets: ['latin'], // Specify subsets if needed
  variable: '--font-playfair', // Define a CSS variable
});

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    // Pass the variable to the CSS
    <>
      <style jsx global>{`
        :root {
          --font-playfair: ${playfair.style.fontFamily};
        }
      `}</style>
      <SessionContextProvider
        supabaseClient={supabase} // Use the imported client instance
        initialSession={pageProps.initialSession}
      >
        {/* Wrap with ProfileProvider */}
        <ProfileProvider>
          {getLayout(<Component {...pageProps} />)}
        </ProfileProvider>
      </SessionContextProvider>
    </>
  );
}

export default MyApp;
