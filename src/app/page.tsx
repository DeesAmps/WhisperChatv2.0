// src/app/page.tsx
'use client';

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';



export default function Home() {
  const bitcoinAddress =
    'bc1qq4am0j9zly8l3vtam0ahsq74pptpfuwxgtlxrhg3ekw3jpwdpdjs35vh48';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-[family-name:var(--font-geist-sans)]">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center flex-1 text-center px-6 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">WhisperChat</h1>
        <p className="max-w-xl text-lg sm:text-xl mb-8">
          End-to-end encrypted, PGP-based chat built in your browser. Your messages
          stay private—only you and your friends can read them.
        </p>
        <div className="space-x-4">
          <Link
            href="/signup"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="inline-block px-6 py-3 border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-50 dark:hover:bg-gray-800 transition"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Features */}
      <main className="w-full max-w-4xl mx-auto px-6 py-16 space-y-12">
        <section className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">🔒 True Privacy</h2>
            <p>
              PGP keypairs generated in your browser—public keys stored in Firestore,
              private keys remain encrypted locally. No server ever sees your plaintext.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">⚡ Simple Workflow</h2>
            <p>
              Sign up with email, generate keys, share your UID, and start chatting
              instantly with an approval workflow.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">👥 Friends & Invites</h2>
            <p>
              Maintain a friends list, send or accept chat requests, or simply copy
              your invite link to share.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">🔑 Key Rotation</h2>
            <p>
              Rotate your PGP keys any time with a dedicated keygen page—your old
              chats remain secure and new ones use fresh keys.
            </p>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-semibold">Learn More</h2>
          <p className="mb-4">
            Curious about how WhisperChat works? Visit our About page to dive deeper into the technology and vision behind the project.
          </p>
          <Link
            href="/about"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition"
          >
            About WhisperChat
          </Link>
        </section>

        {/* Donation QR */}
        <section className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold">Support the Project</h2>
          <p>If you find WhisperChat useful, you can donate Bitcoin:</p>
          <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <QRCodeCanvas
              value={bitcoinAddress}
              size={200}
              bgColor="transparent"
              fgColor="#000000"
              level="M"
            />
          </div>
          <p className="break-all font-mono text-sm">{bitcoinAddress}</p>
        </section>
      </main>
    </div>
  );
}
