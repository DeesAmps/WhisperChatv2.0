// src/contexts/PrivateKeyContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import * as openpgp from 'openpgp';

interface PrivateKeyContextProps {
  privateKey: openpgp.PrivateKey | null;
  setPrivateKey: (key: openpgp.PrivateKey, armored: string) => void;
}

const PrivateKeyContext =
  createContext<PrivateKeyContextProps | undefined>(undefined);

  async function ensureDecrypted(key: openpgp.PrivateKey): Promise<openpgp.PrivateKey> {
    try {
      // Attempt to decrypt with empty passphrase
      return await openpgp.decryptKey({ privateKey: key, passphrase: '' });
    } catch (err: unknown) {
      // If it’s already decrypted, just return it
      if (err instanceof Error && err.message.includes('already decrypted')) {
        return key;
      }
      throw err;
    }
  }

export function PrivateKeyProvider({ children }: { children: ReactNode }) {
  const [privateKey, _setPrivateKey] =
    useState<openpgp.PrivateKey | null>(null);

  // On mount: load armored string, parse, and ensure decrypted
  useEffect(() => {
    const armored = localStorage.getItem('privateKeyArmored');
    if (!armored) return;

    (async () => {
      const readKey = await openpgp.readPrivateKey({ armoredKey: armored });
      const decryptedKey = await ensureDecrypted(readKey);
      _setPrivateKey(decryptedKey);
    })();
  }, []);

  // Wrapped setter: ensure decrypted, persist, then set
  function setPrivateKey(key: openpgp.PrivateKey, armored: string) {
    (async () => {
      const decryptedKey = await ensureDecrypted(key);
      localStorage.setItem('privateKeyArmored', armored);
      _setPrivateKey(decryptedKey);
    })();
  }

  return (
    <PrivateKeyContext.Provider value={{ privateKey, setPrivateKey }}>
      {children}
    </PrivateKeyContext.Provider>
  );
}

export function usePrivateKey() {
  const ctx = useContext(PrivateKeyContext);
  if (!ctx)
    throw new Error('usePrivateKey must be used within PrivateKeyProvider');
  return ctx;
}
