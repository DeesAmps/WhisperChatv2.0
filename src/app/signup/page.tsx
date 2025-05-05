// src/app/signup/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as openpgp from 'openpgp';
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { usePrivateKey } from '../../contexts/PrivateKeyContext';

declare global {
  interface Window {
    grecaptcha: {
      /**
       * Executes a reCAPTCHA v3 check.
       * @param siteKey Your public site key
       * @param options An object with an "action" field
       * @returns A promise that resolves with the token
       */
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
      // you can omit render/reset/getResponse if you’re not using them
    };
  }
}

export default function SignupPage() {
  const router = useRouter();
  const { setPrivateKey } = usePrivateKey();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [passphrase, setPass]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState<string|null>(null);
  const [loading, setLoading]   = useState(false);
  const [pubArmored, setPub]    = useState<string|null>(null);
  const [privArmored, setPriv]  = useState<string|null>(null);
  const [ack, setAck]           = useState(false);
  const [hasUpper, setHasUpper] = useState(false);
  const [hasLower, setHasLower] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false); 

  
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!window.grecaptcha) {
      setError('reCAPTCHA not loaded. Please try again.');
      return;
    }
    const token: string = await window.grecaptcha.execute(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
      { action: 'signup' }  // action name for reCAPTCHA  
    );

    //VERIFIY SERVER-SIDE
    const verify = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'signup' })
    });

    if (!verify.ok) {
      setError('reCAPTCHA verification failed. Please try again.');
      return;
    }


    if (!(hasUpper && hasLower && hasNumber && hasSpecial && password.length >= 12)) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (!passphrase || passphrase !== confirm) {
      setError('Passphrases must match and not be empty.');
      return;
    }

    setLoading(true);
    try {
      // 1) Firebase signup
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2) Generate PGP keypair with passphrase
      const { privateKey: priv, publicKey: pub } =
        await openpgp.generateKey({
          type: 'rsa',
          rsaBits: 2048,
          userIDs: [{ name: email, email }],
          passphrase
        });

      // 3) Read & decrypt private key
      const privKeyObj = await openpgp.readPrivateKey({ armoredKey: priv });
      const decrypted  = await openpgp.decryptKey({ privateKey: privKeyObj, passphrase });

      // 4) Persist in context & localStorage
      setPrivateKey(decrypted, priv);

      // 5) Upload public key
      await setDoc(doc(db, 'publicKeys', user.uid), {
        publicKeyArmored: pub,
        displayName: auth.currentUser!.displayName || '',
        photoURL: auth.currentUser!.photoURL || ''

      });

      // 6) Show for copying
      setPub(pub);
      setPriv(priv);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setHasUpper(/[A-Z]/.test(password));
    setHasLower(/[a-z]/.test(password));
    setHasNumber(/\d/.test(password)); 
    setHasSpecial(/[^A-Za-z0-9]/.test(password));
  }, [password]);
    

  function handleContinue() {
    router.push('/dashboard');
  }

  // If keys generated, show them plus acknowledgement
  if (pubArmored && privArmored) {
    return (
      <div className="max-w-lg mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-mono)]">
        <h1 className="text-2xl font-semibold">Your PGP Keys</h1>
        <p className="text-sm text-gray-700">
          Copy these and keep them safe—your private key is now encrypted with your passphrase.
        </p>
        <div>
          <h2 className="font-medium">Public Key</h2>
          <textarea
            readOnly
            className="w-full h-32 border rounded p-2 font-mono text-xs"
            value={pubArmored}
          />
        </div>
        <div>
          <h2 className="font-medium">Private Key</h2>
          <textarea
            readOnly
            className="w-full h-48 border rounded p-2 font-mono text-xs bg-gray-50"
            value={privArmored}
          />
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={ack}
            onChange={e => setAck(e.target.checked)}
            className="form-checkbox h-5 w-5"
          />
          <span className="text-sm text-gray-700">
            I have saved my keys and remember my passphrase.
          </span>
        </label>
        <button
          disabled={!ack}
          onClick={handleContinue}
          className={`
            w-full h-10 rounded-full font-medium text-sm
            ${ack
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
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSignup} className="space-y-4">
        <label className="block">
          <span>Email</span>
          <input
            type="email"
            className="mt-1 block w-full border rounded px-3 py-2"
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
            className="mt-1 block w-full border rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </label>

         {/* password requirements checklist */}
        <div className="text-sm mb-4 space-y-1">
        <p className="font-medium">Password must include:</p>
          <ul className="list-inside list-disc">
            <li className={hasUpper   ? 'text-green-600' : 'text-gray-500'}>
              Uppercase character
            </li>
            <li className={hasLower   ? 'text-green-600' : 'text-gray-500'}>
              Lowercase character
            </li>
            <li className={hasNumber  ? 'text-green-600' : 'text-gray-500'}>
              Numeric character
            </li>
            <li className={hasSpecial ? 'text-green-600' : 'text-gray-500'}>
              Special character (e.g. !@#$%)
            </li>
            <li className={password.length >= 12 ? 'text-green-600' : 'text-gray-500'}>
              Minimum length of 12 characters
            </li>
          </ul>
        </div>
        <label className="block">
          <span>PGP Passphrase</span>
          <input
            type="password"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={passphrase}
            onChange={e => setPass(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <label className="block">
          <span>Confirm Passphrase</span>
          <input
            type="password"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
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
