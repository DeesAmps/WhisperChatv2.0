// src/app/page.tsx
'use client';

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';

const faqs = [
  {
    question: 'What happens if I lose my private key?',
    answer: `
      Your private key is the only way to decrypt messages sent to you. If you
      lose it (or forget its passphrase), you will no longer be able to read
      past messages. You can generate a new keypair, but older messages encrypted
      under the old key are unrecoverable.
    `,
  },
  {
    question: 'Can I use WhisperChat on multiple devices?',
    answer: `
      Absolutely. Simply copy your encrypted private key (and remember its
      passphrase), then import it via the Dashboard on each device.
    `,
  },
  {
    question: 'What’s the difference between a “friend” and a “chat request”?',
    answer: `
      A “friend” is someone you’ve explicitly added to your friends list (so you
      can jump straight to them). A “chat request” is the in‑conversation approve
      handshake that confirms both parties agree to start exchanging encrypted
      messages.
    `,
  },
  {
    question: 'How is reCAPTCHA v3 used?',
    answer: `
      We run an invisible Google reCAPTCHA v3 check on the signup form to block
      automated bots. No extra click or puzzle is required—you won’t even notice it.
    `,
  },
  {
    question: 'Can I change my profile picture?',
    answer: `
      Yes. Go to your Profile page, upload a small PNG (under 500 KB), and it’ll
      be stored in Firebase Storage—visible to your friends on chat.
    `,
  },
  {
    question: 'Is any message data stored unencrypted?',
    answer: `
      No. Firestore only ever sees ciphertext, timestamps, sender UIDs, and “read”
      metadata. Decryption happens entirely in your browser with OpenPGP.js.
    `,
  },
];

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

        {/* Getting Started Checklist */}
        <section className="space-y-4 max-w-2xl mx-auto py-12">
          <h2 className="text-3xl font-semibold text-center">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Create an account:</strong> Sign up with your email and a
              strong password. You&apos;ll also put in a passphrase to encrypt your private key.
            </li>
            <li>
              <strong>Generate your PGP keys:</strong> On signup you’ll choose a
              passphrase and your RSA‑2048 keypair is generated right in your browser.
            </li>
            <li>
              <strong>Save your keys:</strong> Copy your public & private keys to
              a safe place. Your private key remains encrypted in{' '}
              <code>localStorage</code> and must be unlocked with your passphrase.
            </li>
            <li>
              <strong>Share your UID or Invite Link:</strong> Send a chat invite link from the Chats page. Or go to your profile and copy your UID to share
              with friends.
            </li>
            <li>
              <strong>Search:</strong> Paste an UID on the
              Search page to send a conversation or friend request. Skip this step if you’re using a chat link.
            </li>
            <li>
              <strong>Approve & chat:</strong> Your contact approves on their chats page for chat request or friends page for friend request. Once approved,
              then you can both send end‑to‑end encrypted messages or see them in your friends list.
            </li>
            <li>
              <strong>Rotate keys anytime:</strong> Use the Key Gen page to
              generate a fresh keypair and update your public key on Firestore.
            </li>
          </ol>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-green-600 text-white text-lg rounded-full font-medium hover:bg-green-700 transition"
          >
            Get Started for Free
          </Link>
        </section>

        {/* FAQ Accordion */}
        <section className="space-y-8 max-w-2xl mx-auto py-12">
          <h2 className="text-3xl font-semibold text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map(({ question, answer }, idx) => (
              <details
                key={idx}
                className="border-b border-gray-200 dark:border-gray-700 pb-4"
              >
                <summary className="cursor-pointer list-none text-lg font-medium text-gray-800 dark:text-gray-200">
                  {question}
                </summary>
                <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {answer.trim()}
                </p>
              </details>
            ))}
          </div>
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
