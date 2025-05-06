'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams }       from 'next/navigation';
import Image                          from 'next/image';
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc }               from 'firebase/firestore';
import { db }                        from '../../../lib/firebase';

interface Profile {
  displayName: string;
  photoURL:    string;
}

export default function InvitePage() {
  // 1) Hook declarations (always at the top)
  const params        = useParams();
  const router        = useRouter();
  const [user, setUser]            = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profile, setProfile]      = useState<Profile | null>(null);
  const [status, setStatus]        = useState<string | null>(null);

  // 2) Normalize the uid param
  const rawUid = params?.uid; 
  const targetUid = typeof rawUid === 'string'
    ? rawUid
    : Array.isArray(rawUid) && rawUid.length > 0
      ? rawUid[0]
      : undefined;

  // 3) Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), u => {
      setUser(u);
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  // 4) Load the invitee’s profile when we have a valid uid
  useEffect(() => {
    if (!targetUid) {
      setStatus('Invalid invite link');
      return;
    }
    getDoc(doc(db, 'publicKeys', targetUid))
      .then(snap => {
        if (!snap.exists()) {
          setStatus('User not found');
        } else {
          const d = snap.data()!;
          setProfile({
            displayName: d.displayName,
            photoURL:    d.photoURL
          });
          setStatus(null);
        }
      })
      .catch(() => setStatus('Error loading profile'));
  }, [targetUid]);

  // 5) Handler to send / reuse conversation
  const sendRequest = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!targetUid) {
      setStatus('Invalid invite link');
      return;
    }

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
      setStatus(err instanceof Error ? err.message : 'Failed to start chat');
    }
  };

  // 6) Render states
  if (loadingAuth) {
    return <p className="p-6 text-center">Checking authentication…</p>;
  }

  if (!targetUid) {
    return (
      <p className="p-6 text-center text-red-500">
        Invalid invite link.
      </p>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      {profile ? (
        <>
          <div className="text-center mb-6">
            <Image
              src={profile.photoURL || '/default-avatar.png'}
              alt={profile.displayName}
              width={80}
              height={80}
              className="rounded-full"
            />
            <h1 className="text-2xl font-semibold mt-2">
              {profile.displayName}
            </h1>
          </div>

          <button
            onClick={sendRequest}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {user ? 'Send Chat Request' : 'Log in to Request Chat'}
          </button>

          {status && (
            <p className="mt-4 text-center text-sm text-gray-700">
              {status}
            </p>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500">
          {status || 'Loading…'}
        </p>
      )}
    </div>
  );
}
