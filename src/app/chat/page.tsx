'use client';

import React, { useEffect, useState } from 'react';
import { useRouter }                   from 'next/navigation';
import Image                           from 'next/image';
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
  getDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import Link                            from 'next/link';

interface Thread {
  convId:      string;
  otherUid:    string;
  displayName: string;
  photoURL:    string;
}

export default function ChatHubPage() {
  const router = useRouter();
  const [user, setUser]                 = useState<FirebaseUser|null>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [pending, setPending]           = useState<Thread[]>([]);
  const [active, setActive]             = useState<Thread[]>([]);

  // 1) Wait for Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) setUser(u);
      else  router.replace('/login');
      setAuthLoading(false);
    });
    return unsub;
  }, [router]);

  // 2) Subscribe to all conversations, split pending vs active
  useEffect(() => {
    if (authLoading || !user) return;

    const convRef = collection(db, 'conversations');
    const q       = query(convRef, where('participants','array-contains', user.uid));
    const unsub   = onSnapshot(q, async snap => {
      const pendList: Thread[] = [];
      const actList:  Thread[] = [];
      const uids = new Set<string>();

      // first pass: collect other‐UIDs
      snap.docs.forEach(d => {
        const data = d.data()!;
        const participants = data.participants as string[];
        const other = participants.find(id => id !== user.uid)!;
        uids.add(other);
      });

      // fetch all profiles in one batch
      const profs: Record<string, { displayName: string; photoURL: string }> = {};
      await Promise.all(Array.from(uids).map(async uid => {
        const pk = await getDoc(doc(db, 'publicKeys', uid));
        if (pk.exists()) {
          const d = pk.data()!;
          profs[uid] = {
            displayName: d.displayName || uid.slice(0,6),
            photoURL:    d.photoURL    || '/default-avatar.png'
          };
        } else {
          profs[uid] = {
            displayName: uid.slice(0,6),
            photoURL:    '/default-avatar.png'
          };
        }
      }));

      // second pass: build pending vs active lists
      snap.docs.forEach(d => {
        const data = d.data()!;
        const approvedMap = data.approved as Record<string, boolean>;
        const isApproved = approvedMap[user.uid] === true && Object.values(approvedMap).every(v => v === true);
        const participants = data.participants as string[];
        const other = participants.find(id => id !== user.uid)!;
        const thread: Thread = {
          convId:      d.id,
          otherUid:    other,
          displayName: profs[other].displayName,
          photoURL:    profs[other].photoURL
        };
        if (approvedMap[user.uid]) {
          // your flag is true but maybe the other hasn't accepted yet
          if (isApproved) actList.push(thread);
          else            pendList.push(thread);
        } else {
          pendList.push(thread);
        }
      });

      setPending(pendList);
      setActive(actList);
    },
    err => console.error('Chat hub subscription error:', err));

    return unsub;
  }, [authLoading, user]);

  // 3) Accept a pending request
  const handleAccept = async (convId: string) => {
    if (!user) return;
    const ref = doc(db, 'conversations', convId);
    await updateDoc(ref, { [`approved.${user.uid}`]: true });
  };

  if (authLoading) {
    return <p className="p-6 text-center">Loading…</p>;
  }

  return (
    <div className="min-h-screen p-6 font-[family-name:var(--font-geist-mono)]">
      <h1 className="text-3xl font-semibold mb-6 text-center">Your Chats</h1>

      {/* Incoming Requests */}
      {pending.length > 0 && (
        <section className="mb-10 max-w-lg mx-auto">
          <h2 className="text-2xl font-medium mb-4">Incoming Requests</h2>
          <ul className="space-y-4">
            {pending.map(t => (
              <li key={t.convId} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push(`/chat/${t.convId}`)}>
                  <Image
                    src={t.photoURL}
                    alt={t.displayName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="font-medium">{t.displayName}</span>
                </div>
                <button
                  onClick={() => handleAccept(t.convId)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Accept
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Active Conversations */}
      <section className="max-w-lg mx-auto">
        <h2 className="text-2xl font-medium mb-4">Active Conversations</h2>
        {active.length === 0 ? (
          <p className="text-center text-gray-500">
            You have no active chats. Start one from Search or Friends!
          </p>
        ) : (
          <ul className="space-y-4">
            {active.map(t => (
              <li key={t.convId}>
                <Link
                  href={`/chat/${t.convId}`}
                  className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow"
                >
                  <Image
                    src={t.photoURL}
                    alt={t.displayName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div className="ml-3">
                    <p className="font-medium">{t.displayName}</p>
                    <p className="text-xs text-gray-500">UID: {t.otherUid}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
