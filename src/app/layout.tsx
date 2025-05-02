// src/app/layout.tsx
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { PrivateKeyProvider } from '../contexts/PrivateKeyContext';
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans'
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
});

export const metadata = {
  title: 'WhisperChat',
  description: 'Encrypted PGP chat'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <PrivateKeyProvider>
          <div className="
            grid
            grid-rows-[20px_1fr_20px]
            items-center
            justify-items-center
            min-h-screen
            p-8
            pb-20
            gap-16
            sm:p-20
            font-[family-name:var(--font-geist-sans)]
          ">
            {/* HEADER (optional nav) */}
            <Header />

            {/* MAIN content */}
            <main className="row-start-2 w-full max-w-lg">
              {children}
            </main>

            {/* FOOTER */}
            <Footer />
          </div>
        </PrivateKeyProvider>
      </body>
    </html>
  );
}
