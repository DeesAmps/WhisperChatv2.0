// src/app/components/Footer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import * as openpgp from 'openpgp';
import { usePrivateKey } from '../contexts/PrivateKeyContext';
import Image from 'next/image';

export default function Footer() {
  // 1) Auth state
  const [user, setUser] = useState<import('firebase/auth').User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // 2) Private‑key context
  const { privateKey, setPrivateKey } = usePrivateKey();

    // 3) Mounted + armored key
  const [hasMounted, setHasMounted]   = useState(false);
  const [armoredKey, setArmoredKey]   = useState<string|null>(null);
  useEffect(() => {
    setHasMounted(true);
    setArmoredKey(localStorage.getItem('privateKeyArmored'));
  }, []);

  // 4) Local state for unlock UI
  
  const [passphrase, setPassphrase] = useState('');
  const [unlocking, setUnlocking]   = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // 5) Attempt unlock handler
  const handleUnlock = async () => {
    if (!armoredKey) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      const readKey = await openpgp.readPrivateKey({ armoredKey: armoredKey! })
      const decryptedKey = await openpgp.decryptKey({
        privateKey: readKey,
        passphrase
      });
      setPrivateKey(decryptedKey, armoredKey!);
      setPassphrase('');
    } catch {
      setUnlockError('Incorrect passphrase');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <footer className="
      row-start-3
      w-full container mx-auto px-4 sm:px-6 lg:px-8
      text-center text-xs text-gray-500 dark:text-gray-400
      font-[family-name:var(--font-geist-mono)]
      py-6
    ">
      {/* — Unlock‑Key UI — */}
      {hasMounted && user && armoredKey && !privateKey && (
        <div className="max-w-md mx-auto mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h2 className="text-lg font-semibold mb-2">Unlock Your Private Key</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Enter your PGP passphrase to decrypt your private key and access chats.
          </p>
          {unlockError && (
            <p className="text-red-600 text-sm mb-2">{unlockError}</p>
          )}
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="PGP passphrase"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
              disabled={unlocking}
            />
            <button
              onClick={handleUnlock}
              disabled={unlocking || !passphrase.trim()}
              className={`
                px-4 py-2 rounded-full font-medium
                ${unlocking || !passphrase.trim()
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-foreground text-background hover:bg-[#383838] transition-colors'
                }
              `}
            >
              {unlocking ? 'Unlocking…' : 'Unlock'}
            </button>
          </div>
        </div>
      )}

      {/* — Original Footer Links — */}
      © {new Date().getFullYear()} WhisperChat. All rights reserved.
      <br />
      <Link
        href="/terms"
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-1"
      >
        Terms of Service
      </Link>
      |
      <Link
        href="/privacy"
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-1"
      >
        Privacy Policy
      </Link>
      <div className="flex items-center justify-center mt-3">
        <div className="flex items-center justify-center mt-3">
          <Image
          src="/logo.png"
            alt="WhisperChat Logo"
            width={40}
            height={40}
          />
        </div>
      </div>
    </footer>
  );
}
