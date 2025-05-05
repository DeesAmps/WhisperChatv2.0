'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';

interface Friend {
  uid: string;
  displayName: string;
  photoURL: string;
  convId?: string;
}

interface Request {
  uid: string;
  displayName: string;
  photoURL: string;
  sentAt: { toDate(): Date };
}

interface ConversationData {
  participants: string[];
  approved: Record<string, boolean>;
}

export default function FriendsPage() {
  const router = useRouter();
  const user = auth.currentUser;

  // which tab is active
  const [tab, setTab] = useState<'friends'|'requests'>('friends');

  // --- Friends tab state ---
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [friends, setFriends]       = useState<Friend[]>([]);
  const [convMap, setConvMap]       = useState<Record<string,string>>({});

  useEffect(() => {
    if (!user) return setFriendUids([]);
    const friendsCol = collection(db, 'users', user.uid, 'friends');
    return onSnapshot(friendsCol, snap => {
      setFriendUids(snap.docs.map(d => d.id));
    });
  }, [user]);

  useEffect(() => {
    if (!user) return setConvMap({});
    const convCol = collection(db, 'conversations');
    const convQ   = query(convCol, where('participants', 'array-contains', user.uid));
    const unsub   = onSnapshot(
      convQ,
      snap => {
        const m: Record<string,string> = {};
        snap.docs.forEach(d => {
          const data = d.data() as ConversationData;
          const meOk  = data.approved[user.uid] === true;
          const allOk = Object.values(data.approved).every(v => v === true);
          if (meOk && allOk) {
            const other = data.participants.find(id => id !== user.uid)!;
            m[other] = d.id;
          }
        });
        setConvMap(m);
      },
      err => console.warn('Conversation-list error:', err)
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return setFriends([]);
    if (friendUids.length === 0) return setFriends([]);

    const unsubList = friendUids.map(uid => {
      const pkDoc = doc(db, 'publicKeys', uid);
      return onSnapshot(pkDoc, snap => {
        if (!snap.exists()) return;
        const data = snap.data()!;
        setFriends(prev => {
          const updated: Friend = {
            uid,
            displayName: data.displayName || uid,
            photoURL:    data.photoURL    || '/default-avatar.png',
            convId:      convMap[uid]
          };
          const idx = prev.findIndex(f => f.uid === uid);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
      });
    });

    return () => unsubList.forEach(unsub => unsub());
  }, [user, friendUids, convMap]);

  // --- Requests tab state ---
  const [requests, setRequests] = useState<Request[]>([]);
  useEffect(() => {
    if (!user) return setRequests([]);
    const reqCol = collection(db, 'users', user.uid, 'friendRequests');
    const unsub  = onSnapshot(
      reqCol,
      snap => {
        setRequests(snap.docs.map(d => d.data() as Request));
      },
      err => console.warn('Request-list error:', err)
    );
    return unsub;
  }, [user]);

  async function handleRespond(requesterUid: string, action: 'accept'|'decline') {
    if (!user) return;
    const token = await user.getIdToken();
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requesterUid, action })
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err: unknown) {
      console.error('Respond error:', err);
    }
  }

  if (!user) {
    return <p className="p-6">Loading…</p>;
  }

  return (
    <div className="min-h-screen p-6 font-[family-name:var(--font-geist-mono)]">
      <h1 className="text-3xl font-semibold mb-2 text-center">Your Friends</h1>
      <p className="text-center text-gray-500 mb-6">
        You can add friends by their UID. If your friends list is stuck loading, make sure you&apos;ve put your passphrase in dashboard
      </p>

      {/* Tabs */}
      <div className="flex justify-center mb-8 space-x-8">
        <button
          className={`pb-2 text-lg font-medium ${
            tab === 'friends'
              ? 'border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
          onClick={() => setTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button
          className={`pb-2 text-lg font-medium ${
            tab === 'requests'
              ? 'border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
          onClick={() => setTab('requests')}
        >
          Requests ({requests.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'friends' ? (
        friends.length === 0 ? (
          <p className="text-center text-gray-500">
            You have no friends yet. Go to Search to add someone by UID!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {friends.map(f => (
              <div
                key={f.uid}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center"
              >
                <Image
                  src={f.photoURL}
                  alt={f.displayName || f.uid}
                  width={80}
                  height={80}
                  className="rounded-full mb-3 object-cover"
                />
                <h2 className="font-medium text-lg mb-1 text-center">
                  {f.displayName || f.uid}
                </h2>
                <p className="text-xs text-gray-500 mb-4">UID: {f.uid}</p>
                <div className="mt-auto flex space-x-2">
                  {f.convId ? (
                    <button
                      onClick={() => router.push(`/chat/${f.convId}`)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Chat
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-gray-300 text-gray-600 text-sm rounded opacity-50">
                      No Chat
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      await deleteDoc(
                        doc(db, 'users', user.uid, 'friends', f.uid)
                      );
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <p className="text-center text-gray-500">No incoming requests.</p>
        ) : (
          <ul className="space-y-4 max-w-xl mx-auto">
            {requests.map(r => (
              <li
                key={r.uid}
                className="flex items-center space-x-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <Image
                  src={r.photoURL}
                  alt={r.displayName || r.uid}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium">{r.displayName || r.uid}</p>
                  <p className="text-xs text-gray-500">
                    Sent {r.sentAt.toDate().toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRespond(r.uid, 'accept')}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(r.uid, 'decline')}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
