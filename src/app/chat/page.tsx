'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import {
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';

interface Thread {
  convId: string;
  otherUid: string;
  displayName: string;
  photoURL: string;
}

export default function ChatHubPage() {
  const router = useRouter();
  const [user, setUser]       = useState<FirebaseUser|null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);

  // 1) Wait for Firebase Auth to initialize
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) setUser(u);
      else  router.replace('/login');
      setAuthLoading(false);
    });
    return unsub;
  }, [router]);

  // 2) Once we know we have a user, subscribe to their conversations
  useEffect(() => {
    if (authLoading || !user) return;   // wait until auth is settled

    const convCol = collection(db, 'conversations');
    const convQ   = query(convCol, where('participants','array-contains',user.uid));
    const unsub   = onSnapshot(
      convQ,
      async snap => {
        const list: Thread[] = [];

        for (const d of snap.docs) {
          const data = d.data();
          // only fully approved threads
          if (
            data.approved?.[user.uid] !== true ||
            !Object.values(data.approved).every(v => v === true)
          ) continue;

          const otherUid = (data.participants as string[])
                             .find(id => id !== user.uid)!;

          // fetch their profile
          const pkDoc = await getDoc(doc(db, 'publicKeys', otherUid));
          const pk    = pkDoc.exists() ? pkDoc.data()! : {};
          list.push({
            convId:      d.id,
            otherUid,
            displayName: pk.displayName || otherUid.slice(0,6),
            photoURL:    pk.photoURL    || '/default-avatar.png'
          });
        }
        setThreads(list);
      },
      err => console.error('Chat hub subscription error:', err)
    );

    return unsub;
  }, [authLoading, user]);

  if (authLoading) {
    return <p className="p-6 text-center">Loading…</p>;
  }

  return (
    <div className="min-h-screen p-6 font-[family-name:var(--font-geist-mono)]">
      <h1 className="text-3xl font-semibold mb-6 text-center">Your Chats</h1>

      {threads.length === 0 ? (
        <p className="text-center text-gray-500">
          You have no active chats. Start one from Search or Friends!
        </p>
      ) : (
        <ul className="space-y-4 max-w-lg mx-auto">
          {threads.map(t => (
            <li key={t.convId}>
              <Link
                href={`/chat/${t.convId}`}
                className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow"
              >
                <img
                  src={t.photoURL}
                  alt={t.displayName}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <p className="font-medium">{t.displayName}</p>
                  <p className="text-xs text-gray-500">UID: {t.otherUid}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
