// src/app/signup/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as openpgp from 'openpgp';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { usePrivateKey } from '../../contexts/PrivateKeyContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setPrivateKey } = usePrivateKey();
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Generate keypair
      const { privateKey: privArmored, publicKey: pubArmored } =
        await openpgp.generateKey({
          type: 'rsa',
          rsaBits: 2048,
          userIDs: [{ name: email, email }],
          passphrase: ''
        });

      // Save private key in memory
      const privKeyObj = await openpgp.readPrivateKey({ armoredKey: privArmored });
      setPrivateKey(privKeyObj);

      // Upload public key
      await setDoc(doc(db, 'publicKeys', uid), {
        uid,
        publicKeyArmored: pubArmored
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Signup failed: ' + err.message);
      } else {
        alert('Signup failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="
      flex flex-col gap-[32px]
      items-center sm:items-start
      font-[family-name:var(--font-geist-mono)]
    ">
      <h1 className="text-2xl font-semibold mb-2">Sign Up</h1>
      <form onSubmit={handleSignup} className="space-y-4 w-full">
        <label className="block">
          <span>Email</span>
          <input
            type="email"
            className="
              mt-1 block w-full border border-gray-300 rounded-md
              px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span>Password</span>
          <input
            type="password"
            className="
              mt-1 block w-full border border-gray-300 rounded-md
              px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="
            w-full h-10 rounded-full
            bg-foreground text-background font-medium text-sm
            hover:bg-[#383838] dark:hover:bg-[#ccc]
            transition-colors disabled:opacity-50
          "
        >
          {loading ? 'Signing up…' : 'Sign Up & Generate Keys'}
        </button>
      </form>
    </div>
  );
}
