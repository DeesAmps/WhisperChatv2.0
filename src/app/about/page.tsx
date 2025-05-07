// src/app/about/page.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import Link from 'next/link';
const faqs = [
  {
    question: 'What happens if I lose my private key?',
    answer: `
      Your private key is the only way to decrypt messages sent to you. If you
      lose it (or forget its passphrase), you will no longer be able to read
      past messages. You can generate a new keypair via the Key Gen page, but
      messages encrypted under your old key remain unrecoverable.
    `,
  },
  {
    question: 'Can I use WhisperChat on multiple devices?',
    answer: `
      Absolutely. Simply export your encrypted private key (from Dashboard → Export),
      then import it (Dashboard → Import) on each device. Remember your passphrase!
    `,
  },
  {
    question: 'What’s the difference between a “friend” and a “chat request”?',
    answer: `
      A “friend” lives in your sidebar for one‐click chatting. A “chat request”
      is the one‑time PGP handshake in Firestore’s conversations/approved map that
      both participants must flip to true before messages flow.
    `,
  },
  {
    question: 'How is reCAPTCHA v3 used?',
    answer: `
      We run an invisible Google reCAPTCHA v3 check on the signup form to block
      bot signups. It runs silently in the background—no puzzles or clicks required.
    `,
  },
  {
    question: 'Can I change my profile picture?',
    answer: `
      Yes. On your Profile page, upload a PNG under 200 KB and we’ll store it
      securely in Firebase Storage. It shows up everywhere you chat.
    `,
  },
  {
    question: 'Is any message data stored unencrypted?',
    answer: `
      No. Firestore only ever sees ciphertext, sender UIDs, timestamps, and
      read‑status metadata. Decryption happens entirely in your browser via OpenPGP.js.
    `,
  },
];

export default function AboutPage() {
  const bitcoinAddress =
    'bc1qq4am0j9zly8l3vtam0ahsq74pptpfuwxgtlxrhg3ekw3jpwdpdjs35vh48';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Page Title */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">About WhisperChat</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Learn how WhisperChat works under the hood, get started, and find answers
            to common questions.
          </p>
        </header>

        {/* Getting Started (Detailed) */}
        <section id="getting-started" className="space-y-8">
          <h2 className="text-3xl font-semibold">Getting Started</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">1. Sign Up & CAPTCHA</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Create an account with email & password. During signup we run an
                invisible reCAPTCHA v3 check (no extra clicks). Upon success your
                account is created and your PGP keypair is generated.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">2. PGP Key Generation</h3>
              <p className="text-gray-700 dark:text-gray-300">
                In‑browser, we generate an RSA‑2048 keypair (via OpenPGP.js). Your
                <em>public key</em> goes to Firestore; your <em>private key</em> is
                encrypted by your passphrase and stored only in <code>localStorage</code>.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">3. Save & Backup</h3>
              <p className="text-gray-700 dark:text-gray-300">
                From the Dashboard you can export both your public & private keys.
                Store them safely—if you lose your private key or forget its
                passphrase, past messages cannot be recovered.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">4. Build Your Network</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Share your UID (found on Dashboard) with friends. They can search by
                UID to send you a chat request, which you approve on your Dashboard.
                Once both parties flip “approved” in Firestore, the conversation
                unlocks.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">5. Real‑Time Encrypted Chat</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Messages you send are encrypted to <strong>both</strong> public keys
                (yours & theirs) so you can decrypt your own sends. All encryption/
                decryption happens client‑side; Firestore stores only ciphertext.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">6. Key Rotation</h3>
              <p className="text-gray-700 dark:text-gray-300">
                When you want fresh keys, visit the Key Gen page. It generates a new
                keypair, updates your Firestore public key, and replaces the private
                key in your browser (encrypted under your passphrase).
              </p>
            </div>
          </div>
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

        {/* Data Flow Diagram */}
        <section id="architecture" className="space-y-4">
          <h2 className="text-3xl font-semibold">How It Works</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Below is the high‑level data flow: signup, key‑exchange, message
            encryption in the browser, Firestore storage, and decryption on the
            client.
          </p>
          <div className="w-full overflow-auto">
            <Image
              src="/diagram.png"
              alt="WhisperChat Data Flow Diagram"
              width={1024}
              height={600}
              className="mx-auto rounded-lg shadow"
            />
          </div>
        </section>

        {/* FAQ Accordion */}
        <section id="faq" className="space-y-4">
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

        {/* Support */}
        <section id="support" className="space-y-4 text-center">
          <h2 className="text-3xl font-semibold">Support the Project</h2>
          <p className="text-gray-700 dark:text-gray-300">
            If you find WhisperChat useful, a Bitcoin donation helps keep it online:
          </p>
          <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <QRCodeCanvas
              value={bitcoinAddress}
              size={180}
              bgColor="transparent"
              fgColor="#000000"
              level="M"
            />
          </div>
          <p className="break-all font-mono text-sm">{bitcoinAddress}</p>
        </section>
      </div>
    </div>
  );
}
