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
  const [inviteCopied, setInviteCopied] = useState(false);

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

    const unsub = onSnapshot(q, async snap => {
      const pendList: Thread[] = [];
      const actList: Thread[]  = [];
      const uids = new Set<string>();

      // ── First pass: collect other‐UIDs safely ───────────────────────
      for (const d of snap.docs) {
        const data = d.data();
        if (!Array.isArray(data.participants)) {
          console.warn(`Skipping convo ${d.id}: invalid participants`, data);
          continue;
        }
        const participants = data.participants as string[];
        const other = participants.find(id => id !== user.uid);
        if (other) uids.add(other);
      }

      // ── Fetch all profiles in one batch ────────────────────────────
      const profs: Record<string, { displayName: string; photoURL: string }> = {};
      await Promise.all(
        Array.from(uids).map(async u => {
          const snap = await getDoc(doc(db, 'publicKeys', u));
          if (snap.exists()) {
            const d = snap.data()!;
            profs[u] = {
              displayName: d.displayName || u.slice(0,6),
              photoURL:    d.photoURL    || '/default-avatar.png'
            };
          } else {
            profs[u] = {
              displayName: u.slice(0,6),
              photoURL:    '/default-avatar.png'
            };
          }
        })
      );

      // ── Second pass: build pending vs active safely ────────────────
      for (const d of snap.docs) {
        const data = d.data();
        // guard missing or malformed fields
        if (
          !Array.isArray(data.participants) ||
          typeof data.approved !== 'object' ||
          data.approved === null
        ) {
          continue;
        }

        const participants = data.participants as string[];
        const approvedMap  = data.approved as Record<string, boolean>;
        const other = participants.find(id => id !== user.uid);
        if (!other) continue;

        const thread: Thread = {
          convId:      d.id,
          otherUid:    other,
          displayName: profs[other].displayName,
          photoURL:    profs[other].photoURL
        };

        const myFlag  = approvedMap[user.uid] === true;
        const allOk   = myFlag && Object.values(approvedMap).every(v => v === true);

        if (!myFlag) {
          pendList.push(thread);
        } else if (allOk) {
          actList.push(thread);
        } else {
          // I'm approved but they aren't yet
          pendList.push(thread);
        }
      }

      setPending(pendList);
      setActive(actList);
    }, err => console.error('Chat hub subscription error:', err));

    return unsub;
  }, [authLoading, user]);

  // 3) Accept a pending request
  const handleAccept = async (convId: string) => {
    if (!user) return;
    const ref = doc(db, 'conversations', convId);
    await updateDoc(ref, { [`approved.${user.uid}`]: true });
  };

  // 4) Invite link logic
  const inviteLink =
    typeof window !== 'undefined' && user
      ? `${window.location.origin}/invite/${user.uid}`
      : '';
  const copyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 3000);
    } catch {
      // silent
    }
  };

  if (authLoading) {
    return <p className="p-6 text-center">Loading…</p>;
  }

  return (
    <div className="min-h-screen p-6 font-[family-name:var(--font-geist-mono)]">

      {/* Invite Button */}
      <div className="max-w-lg mx-auto mb-6 text-center">
        <button
          onClick={copyInvite}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          📎 Copy Invite Link
        </button>
        {inviteCopied && (
          <p className="mt-2 text-sm text-green-500">Link copied to clipboard!</p>
        )}
      </div>

      <h1 className="text-3xl font-semibold mb-6 text-center">Your Chats</h1>

      {/* Incoming Requests */}
      {pending.length > 0 && (
        <section className="mb-10 max-w-lg mx-auto">
          <h2 className="text-2xl font-medium mb-4">Incoming Requests</h2>
          <ul className="space-y-4">
            {pending.map(t => (
              <li
                key={t.convId}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => router.push(`/chat/${t.convId}`)}
                >
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
