// src/app/layout.tsx
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { PrivateKeyProvider } from '../contexts/PrivateKeyContext';
import React from 'react';

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
            <header className="row-start-1 w-full max-w-lg flex justify-end gap-4 text-sm">
              <a href="/signup">Sign Up</a>
              <a href="/search">Start Chat</a>
              <a href="/dashboard">Dashboard</a>
            </header>

            {/* MAIN content */}
            <main className="row-start-2 w-full max-w-lg">
              {children}
            </main>

            {/* FOOTER */}
            <footer className="
              row-start-3
              flex
              gap-[24px]
              flex-wrap
              items-center
              justify-center
              text-sm
              text-gray-500
            ">
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              >
                Deployed on Vercel
              </a>
              <a
                href="https://github.com/DeesAmps/WhisperChatv2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              >
                View Source
              </a>
            </footer>
          </div>
        </PrivateKeyProvider>
      </body>
    </html>
  );
}
