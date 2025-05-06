// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter }                   from 'next/navigation';
import { auth, db }                    from '../../lib/firebase';
import {
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  Timestamp
} from 'firebase/firestore';

export default function DashboardPage() {
  const router = useRouter();

  // — Auth state —
  const [user, setUser]               = useState<FirebaseUser|null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // — Counts & stats —
  const [friendReqCount, setFriendReqCount] = useState(0);
  const [convReqCount, setConvReqCount]     = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // — Invite link copied feedback —
  const [inviteCopied, setInviteCopied] = useState(false);

  // 1) Listen for auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) setUser(u);
      else  router.replace('/login');
      setLoadingAuth(false);
    });
    return unsub;
  }, [router]);

  // 2) Friend‑requests count
  useEffect(() => {
    if (!user) return;
    const frCol = collection(db, 'users', user.uid, 'friendRequests');
    return onSnapshot(frCol, snap => setFriendReqCount(snap.size));
  }, [user]);

  // 3) Conversation‑requests count
  useEffect(() => {
    if (!user) return;
    const convCol = collection(db, 'conversations');
    const q = query(
      convCol,
      where('participants', 'array-contains', user.uid),
      where(`approved.${user.uid}`, '==', false)
    );
    return onSnapshot(q, snap => setConvReqCount(snap.size));
  }, [user]);

  // 4) Unread‑messages count (last 24h)
  useEffect(() => {
    if (!user) return;

    const computeUnread = async () => {
      // cutoff 24h ago
      const cutoff = Timestamp.fromDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      // 1) Get all your approved conversations
      const convQ = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid),
        where(`approved.${user.uid}`, '==', true)
      );
      const convSnap = await getDocs(convQ);

      let total = 0;

      // 2) For each conversation, count messages since cutoff not sent by you
      await Promise.all(
        convSnap.docs.map(async convDoc => {
          const msgsQ = query(
            collection(db, 'conversations', convDoc.id, 'messages'),
            where('timestamp', '>', cutoff)
          );
          const msgsSnap = await getDocs(msgsQ);
          // subtract any you sent
          const unreadHere = msgsSnap.docs.filter(d => d.data().sender !== user.uid).length;
          total += unreadHere;
        })
      );

      setUnreadMsgCount(total);
    };

    // trigger
    computeUnread().catch(err => console.error('Unread count error:', err));
  }, [user]);

  // 5) Invite link + copy logic
  const inviteLink =
    typeof window !== 'undefined' && user
      ? `${window.location.origin}/invite/${user.uid}`
      : '';
  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 3000);
  };

   // 6) Copy UID
   const copyUid = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    alert('UID copied to clipboard!');
  };


  if (loadingAuth) {
    return <p className="p-6 text-center">Loading…</p>;
  }

  return (
    <div className="min-h-screen p-6 space-y-8 font-[family-name:var(--font-geist-mono)]">
      {/* Welcome */}
      <h1 className="text-3xl font-semibold text-center">
        Welcome, {user?.displayName ?? user?.uid.slice(0,6)}!
      </h1>

      {user && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
          <h2 className="text-lg font-medium mb-2">Your UID</h2>
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 font-mono text-sm text-gray-900 dark:text-gray-100">
            <span className="truncate">{user.uid}</span>
            <button
              onClick={copyUid}
              className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Copy
            </button>
          </div>
        </section>
      )}

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
          <h2 className="text-lg font-medium">Messages in the last 24hr</h2>
          <p className="text-2xl">{unreadMsgCount}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
          <h2 className="text-lg font-medium">Friend Requests</h2>
          <p className="text-2xl">{friendReqCount}</p>
          <button
            onClick={() => router.push('/friends?tab=requests')}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Manage
          </button>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
          <h2 className="text-lg font-medium">Chat Requests</h2>
          <p className="text-2xl">{convReqCount}</p>
          <button
            onClick={() => router.push('/chat')}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Review
          </button>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
          <h2 className="text-lg font-medium">Invite a Friend</h2>
          <button
            onClick={copyInvite}
            className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Copy Link
          </button>
          {inviteCopied && (
            <p className="mt-1 text-sm text-green-500">Copied!</p>
          )}
        </div>
      </div>

      {/* Quick‑nav Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => router.push('/search')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          🔍 Search by UID
        </button>
        <button
          onClick={() => router.push('/friends')}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          👥 Friends
        </button>
        <button
          onClick={() => router.push('/chat')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          💬 Chats Hub
        </button>
        <button
          onClick={() => router.push('/keygen')}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
        >
          🔐 Rotate Keys
        </button>
        <button
          onClick={() => router.push('/profile')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          ⚙️ Profile
        </button>
      </div>
    </div>
  );
}
