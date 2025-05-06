// src/app/invite/[uid]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Profile {
  displayName: string;
  photoURL: string;
}

export default function InvitePage() {
  const { uid: targetUid } = useParams<{ uid: string }>();
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // 1) Wait for auth (and redirect to login if needed)
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), u => {
      setUser(u);
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  // 2) Load target’s profile
  useEffect(() => {
    if (!targetUid) return;
    getDoc(doc(db, 'publicKeys', targetUid)).then(snap => {
      if (!snap.exists()) {
        setProfile(null);
        setStatus('User not found');
      } else {
        const d = snap.data()!;
        setProfile({
          displayName: d.displayName,
          photoURL:    d.photoURL,
        });
        setStatus(null);
      }
    });
  }, [targetUid]);

  // 3) Request chat
  const sendRequest = async () => {
    if (!user) return router.push('/login');
    setStatus('🚀 Sending request…');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({ participants: [user.uid, targetUid] })
      });
      if (!res.ok) throw new Error(await res.text());
      const { convId } = await res.json();
      router.push(`/chat/${convId}`);
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (loadingAuth) {
    return <p className="p-6 text-center">Checking authentication…</p>;
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-8 font-[family-name:var(--font-geist-mono)]">
      {profile ? (
        <>
          <div className="flex flex-col items-center space-y-4 mb-6">
            <Image
              src={profile.photoURL || '/default-avatar.png'}
              alt={profile.displayName}
              width={80}
              height={80}
              className="rounded-full"
            />
            <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
            <p className="text-xs text-gray-500">UID: {targetUid}</p>
          </div>

          <button
            onClick={sendRequest}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            {user
              ? 'Send Chat Request'
              : 'Log in to Request Chat'}
          </button>

          {status && <p className="mt-4 text-center text-sm">{status}</p>}
        </>
      ) : (
        <p className="text-center text-red-500">{status || 'Loading…'}</p>
      )}
    </div>
  );
}
