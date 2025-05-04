// src/app/page.tsx
'use client';

import React from 'react';
import {QRCodeCanvas} from 'qrcode.react';

export default function Home() {
  const bitcoinAddress = 'bc1qq4am0j9zly8l3vtam0ahsq74pptpfuwxgtlxrhg3ekw3jpwdpdjs35vh48';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-[family-name:var(--font-geist-sans)]">
    

      <main className="w-full max-w-2xl space-y-8">
        {/* How to use */}
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">How to Use WhisperChatv2</h2>
          <p>
            WhisperChatv2 is a secure messaging app that uses PGP encryption to keep your conversations private. I built this in my spare time and will be maintaining it when I have time. 
            Here&apos;s how to get started:
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Sign up with your email &amp; password.</li>
            <li>On signup, a PGP keypair is generated right in your browser.</li>
            <li>Your <em>public key</em> is stored in Firestore; your private key stays encrypted in your browser.</li>
            <li>If you reload your browser, the armoured key stays in storage but will need to be decrypted with your passphrase. Do this from the dashboard.</li>
            <li>The app will pull your friends public key from the database as it is stored in a separate container and is referenced by their UID. User email / password is not stored in this table.</li>
            <li>Passwords are salted + hashed. Emails are not verified so you can realistically put whatever you want in this field as long as it matches ###@###.### but if you need to password reset you&apos;re screwed.</li>
            <li>Share your UID (found on your Dashboard) with friends to start a chat.</li>
            <li>Approve incoming requests on your Dashboard, then start messaging.</li>
          </ol>
        </section>

        {/* Encryption explanation */}
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">How Encryption Works</h2>
          <p>
            <strong> WARNING: IF YOU LOSE YOUR PRIVATE KEY, YOU WILL NOT BE ABLE TO DECRYPT YOUR MESSAGES. </strong>
            <br />
            You can always generate a new keypair, but you will lose access to any messages encrypted with the old key.
            <br />
            All messages are <strong>end‑to‑end encrypted</strong> using PGP (OpenPGP.js): 
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              When you send a message, it’s encrypted with <em>both</em> your friend’s public key <strong>and</strong> your own public key—so both of you can decrypt.
            </li>
            <li>
              Your private key never leaves your browser, and is stored only in encrypted form (protected by your passphrase) in <code>localStorage</code>.
            </li>
            <li>
              Firestore stores only ciphertext; message decryption happens entirely client‑side.
            </li>
          </ul>
        </section>

         {/* Donation QR section */}
      <section className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Support the Project</h2>
        <p>If you find WhisperChatv2 useful, you can donate Bitcoin:</p>
        <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <QRCodeCanvas
            value={bitcoinAddress}
            size={200}
            bgColor="transparent"
            fgColor="#000000"
            level="M"
            includeMargin={false}
          />
        </div>
        <p className="break-all font-mono text-sm">{bitcoinAddress}</p>
      </section>
      </main>
    </div>
  );
}
