// src/app/signup/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as openpgp from 'openpgp';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { usePrivateKey } from '../../contexts/PrivateKeyContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pubArmored, setPubArmored] = useState<string | null>(null);
  const [privArmored, setPrivArmored] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const router = useRouter();
  const { setPrivateKey } = usePrivateKey();


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1) Create Firebase user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // 2) Generate PGP key pair
      const { privateKey: priv, publicKey: pub } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 2048,
        userIDs: [{ name: email, email }],
        passphrase: ''
      });

      // 3) Parse private key and store in context+localStorage
      const privKeyObj = await openpgp.readPrivateKey({ armoredKey: priv });
      setPrivateKey(privKeyObj, priv);

      // 4) Upload public key to Firestore
      await setDoc(doc(db, 'publicKeys', uid), {
        uid,
        publicKeyArmored: pub
      });

      // 5) Show the armored keys for the user to copy
      setPubArmored(pub);
      setPrivArmored(priv);
    } catch (err: unknown) {
      if (err instanceof Error) alert('Signup failed: ' + err.message);
      else alert('Signup failed');
      setLoading(false);
    }
  };

  // Once keys are displayed and user clicks continue, go to dashboard
  const handleContinue = () => {
    router.push('/dashboard');
  };

  // If we have keys, show them instead of the form
  if (pubArmored && privArmored) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-mono)]">
        <h1 className="text-2xl font-semibold">Save Your PGP Keys</h1>
        <p className="text-sm text-gray-700">
          Please copy and securely store these keys. You will need your private key to decrypt messages.
        </p>

        <div>
          <h2 className="font-medium mb-1">Public Key</h2>
          <textarea
            readOnly
            className="w-full h-32 border rounded p-2 font-mono text-xs"
            value={pubArmored}
          />
        </div>

        <div>
          <h2 className="font-medium mb-1">Private Key</h2>
          <textarea
            readOnly
            className="w-full h-48 border rounded p-2 font-mono text-xs bg-gray-50"
            value={privArmored}
          />
        </div>
        {/* New: acknowledgment checkbox */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              className="form-checkbox h-5 w-5"
            />
            <span className="text-sm text-gray-700">
              I have securely saved both my public and private keys.
            </span>
          </label>

          <button
            
            onClick={handleContinue}
            disabled={!acknowledged}
            className={`
              w-full h-10 rounded-full font-medium text-sm
              ${acknowledged
                ? 'bg-foreground text-background hover:bg-[#383838]'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'}
              transition-colors
            `}
          >
          Continue to Dashboard
        </button>
      </div>
    );
  }

  // Otherwise render signup form
  return (
    <div className="max-w-md mx-auto p-6 font-[family-name:var(--font-geist-mono)]">
      <h1 className="text-2xl font-semibold mb-4">Sign Up</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <label className="block">
          <span>Email</span>
          <input
            type="email"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <label className="block">
          <span>Password</span>
          <input
            type="password"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-full bg-foreground text-background font-medium hover:bg-[#383838] transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing up…' : 'Sign Up & Generate Keys'}
        </button>
      </form>
    </div>
  );
}
