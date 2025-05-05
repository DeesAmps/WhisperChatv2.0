// src/app/layout.tsx
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { PrivateKeyProvider } from '../contexts/PrivateKeyContext';
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata = {
  title: 'WhisperChat',
  description: 'Encrypted PGP chat',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-screen w-screen`}>
      <head>
        {/* reCAPTCHA v3 */}
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 h-screen w-screen">
        <PrivateKeyProvider>
          <div className="
            grid
            grid-rows-[auto_1fr_auto]
            min-h-screen
            p-8
            pb-20
            gap-16
            sm:p-20
            font-[family-name:var(--font-geist-sans)]
          ">

            <div className="row-start-1 w-full container mx-auto px-4 sm:px-6 lg:px-8">
             <Header />
           </div>
           

            {/* now a responsive, centered container */}
              <main className="row-start-2 w-full container mx-auto px-4 sm:px-6 lg:px-8">
              <Analytics />
              <SpeedInsights />
              {children}
            </main>

            <div className="row-start-3 w-full container mx-auto px-4 sm:px-6 lg:px-8">
             <Footer />
            </div>
          </div>
        </PrivateKeyProvider>
      </body>
    </html>
  );
}
