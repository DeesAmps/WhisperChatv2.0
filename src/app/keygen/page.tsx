// src/app/keygen/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import * as openpgp from 'openpgp';
import { usePrivateKey } from '../../contexts/PrivateKeyContext';

export default function KeyGenPage() {
  const router = useRouter();
  const { setPrivateKey } = usePrivateKey();

  const [user, setUser]                     = useState<User|null>(null);
  const [passphrase, setPassphrase]         = useState('');
  const [confirm, setConfirm]               = useState('');
  const [error, setError]                   = useState<string|null>(null);
  const [loading, setLoading]               = useState(false);
  const [pubArmored, setPubArmored]         = useState<string|null>(null);
  const [privArmored, setPrivArmored]       = useState<string|null>(null);
  const [ack, setAck]                       = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) router.replace('/login');
      else setUser(u);
    });
    return unsub;
  }, [router]);

  const handleGenerate = async () => {
    setError(null);
    if (!passphrase || passphrase !== confirm) {
      setError('Passphrases must match and not be empty.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      // 1) Generate
      const { privateKey: priv, publicKey: pub } =
        await openpgp.generateKey({
          type: 'rsa',
          rsaBits: 2048,
          userIDs: [{ name: user.email||user.uid, email: user.email||undefined }],
          passphrase
        });

      // 2) Read & decrypt
      const privKeyObj = await openpgp.readPrivateKey({ armoredKey: priv });
      const decrypted  = await openpgp.decryptKey({ privateKey: privKeyObj, passphrase });

      // 3) Persist
      setPrivateKey(decrypted, priv);

      // 4) Overwrite Firestore
      await setDoc(doc(db, 'publicKeys', user.uid), {
        
        publicKeyArmored: pub,
        displayName: auth.currentUser!.displayName || '',
        photoURL:   auth.currentUser!.photoURL   || '',
      });

      // 5) Show to user
      setPubArmored(pub);
      setPrivArmored(priv);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Key generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => router.push('/dashboard');

  if (pubArmored && privArmored) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-mono)]">
        <h1 className="text-2xl font-semibold">Your New PGP Keys</h1>
        {error && <p className="text-red-600">{error}</p>}
        <textarea
          readOnly
          className="w-full h-32 border rounded p-2 font-mono text-xs"
          value={pubArmored}
        />
        <textarea
          readOnly
          className="w-full h-48 border rounded p-2 font-mono text-xs bg-gray-50"
          value={privArmored}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={ack}
            onChange={e => setAck(e.target.checked)}
            className="form-checkbox h-5 w-5"
          />
          <span className="text-sm">I have saved my keys and passphrase.</span>
        </label>
        <button
          disabled={!ack}
          onClick={handleContinue}
          className={`
            w-full h-10 rounded-full text-sm font-medium
            ${ack
              ? 'bg-foreground text-background hover:bg-[#383838]'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'}
            transition-colors
          `}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 font-[family-name:var(--font-geist-mono)]">
      <h1 className="text-2xl font-semibold mb-4">Generate New PGP Keys</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <label className="block mb-2">
        <span>New Passphrase</span>
        <input
          type="password"
          className="mt-1 block w-full border rounded px-3 py-2"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          disabled={loading}
        />
      </label>
      <label className="block mb-4">
        <span>Confirm Passphrase</span>
        <input
          type="password"
          className="mt-1 block w-full border rounded px-3 py-2"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          disabled={loading}
        />
      </label>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full h-10 rounded-full bg-foreground text-background font-medium hover:bg-[#383838] transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate New Key Pair'}
      </button>
    </div>
  );
}
