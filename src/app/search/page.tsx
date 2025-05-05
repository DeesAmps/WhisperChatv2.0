// src/app/search/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';

interface Profile {
  displayName: string;
  photoURL: string;
}

export default function SearchPage() {
  const [targetUid, setTargetUid]           = useState('');
  const [status, setStatus]                 = useState<string|null>(null);
  const [profile, setProfile]               = useState<Profile|null>(null);
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    return onAuthStateChanged(getAuth(), user => {
      if (!user) router.replace('/login');
    });
  }, [router]);

  // 1) Lookup user by UID and show profile
  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setStatus('🔍 Checking user…');
    setProfile(null);

    const auth = getAuth();
    const me   = auth.currentUser!;
    if (targetUid === me.uid) {
      setStatus("❌ You can’t chat with yourself");
      return;
    }

    // Verify user has a publicKey entry
    const pubSnap = await getDoc(doc(db, 'publicKeys', targetUid));
    if (!pubSnap.exists()) {
      setStatus('❌ User not found');
      return;
    }

    const data = pubSnap.data()!;
    setProfile({
      displayName: data.displayName,
      photoURL:    data.photoURL
    });
    setStatus(null);
  }

  // 2) Add friend via API route
  async function handleAddFriend() {
    setStatus('➕ Adding friend…');
    try {
      const auth = getAuth();
      const me   = auth.currentUser!;
      const token = await me.getIdToken();

      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({ friendUid: targetUid })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || res.statusText);
      }
      setStatus('✅ Friend added!');
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to add friend';
      setStatus(message);
    }
  }

  // 3) Start (or reuse) conversation
  async function handleStartChat() {
    setStatus('💬 Opening chat…');
    try {
      const auth = getAuth();
      const me   = auth.currentUser!;
      const token = await me.getIdToken();

      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({ participants: [me.uid, targetUid] })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const { convId } = await res.json();
      router.push(`/chat/${convId}`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to start chat';
      setStatus(message);
    }
  }

  return (
    <div className="
      flex flex-col gap-8
      items-center sm:items-start
      font-[family-name:var(--font-geist-mono)]
      p-4
    ">
      <h1 className="text-2xl font-semibold">Start a Chat</h1>

      {/* Lookup Form */}
      <form onSubmit={handleLookup} className="space-y-4 w-full max-w-md">
        <label className="block">
          <span>Friend’s UID</span>
          <input
            type="text"
            className="
              mt-1 block w-full
              border border-gray-300 rounded-md
              px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            value={targetUid}
            onChange={e => setTargetUid(e.target.value.trim())}
            required
          />
        </label>
        <button
          type="submit"
          className="
            w-full h-10 rounded-full
            bg-foreground text-background font-medium text-sm
            hover:bg-[#383838] dark:hover:bg-[#ccc]
            transition-colors
          "
        >
          Lookup User
        </button>
      </form>

      {/* Status Message */}
      {status && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
          {status}
        </p>
      )}

      {/* Profile Card + Actions */}
      {profile && (
        <div className="mt-6 p-4 border rounded-md max-w-md w-full flex items-center space-x-4">
          <Image
            src={profile.photoURL || '/default-avatar.png'}
            alt={profile.displayName}
            width={48}
            height={48}
            className="rounded-full"
          />
          <div className="flex-1">
            <p className="font-medium">{profile.displayName || targetUid}</p>
            <div className="mt-2 flex space-x-3">
              <button
                onClick={handleAddFriend}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Add Friend
              </button>
              <button
                onClick={handleStartChat}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
