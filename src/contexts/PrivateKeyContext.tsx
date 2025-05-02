'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode
} from 'react';
import * as openpgp from 'openpgp';

interface PrivateKeyContextProps {
  privateKey: openpgp.PrivateKey | null;
  setPrivateKey: (key: openpgp.PrivateKey) => void;
}

const PrivateKeyContext =
  createContext<PrivateKeyContextProps | undefined>(undefined);

export function PrivateKeyProvider({
  children
}: {
  children: ReactNode;
}) {
  const [privateKey, setPrivateKey] =
    useState<openpgp.PrivateKey | null>(null);

  return (
    <PrivateKeyContext.Provider
      value={{ privateKey, setPrivateKey }}
    >
      {children}
    </PrivateKeyContext.Provider>
  );
}

export function usePrivateKey() {
  const ctx = useContext(PrivateKeyContext);
  if (!ctx)
    throw new Error(
      'usePrivateKey must be used within PrivateKeyProvider'
    );
  return ctx;
}
