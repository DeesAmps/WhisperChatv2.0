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

export function PrivateKeyProvider({ children }: { children: ReactNode }) {
  const [privateKey, _setPrivateKey] =
    useState<openpgp.PrivateKey | null>(null);

  // On initial load, fetch from localStorage
  useEffect(() => {
    const armored = localStorage.getItem('privateKeyArmored');
    if (armored) {
      openpgp.readPrivateKey({ armoredKey: armored }).then((key) => {
        _setPrivateKey(key);
      });
    }
  }, []);

  // Wrap set to also persist armored text
  function setPrivateKey(key: openpgp.PrivateKey, armored: string) {
    localStorage.setItem('privateKeyArmored', armored);
    _setPrivateKey(key);
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
