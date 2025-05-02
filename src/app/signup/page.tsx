'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as openpgp from 'openpgp';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { usePrivateKey } from '../../contexts/PrivateKeyContext';
import React from 'react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setPrivateKey } = usePrivateKey();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1) Firebase Auth signup
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCred.user.uid;

      // 2) Generate PGP key pair
      const { privateKey: privArmored, publicKey: pubArmored } =
        await openpgp.generateKey({
          type: 'rsa',
          rsaBits: 2048,
          userIDs: [{ name: email, email }],
          passphrase: '' // no passphrase for simplicity
        });

      // 3) Load private key object into context
      const privKeyObj = await openpgp.readPrivateKey({
        armoredKey: privArmored
      });
      setPrivateKey(privKeyObj);

      // 4) Store public key in Firestore
      await setDoc(doc(db, 'publicKeys', uid), {
        uid,
        publicKeyArmored: pubArmored
      });

      // 5) Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Signup failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <label style={{ display: 'block', marginTop: '1rem' }}>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: '1rem' }}
        >
          {loading ? 'Signing up…' : 'Sign Up & Generate Keys'}
        </button>
      </form>
    </div>
  );
}
