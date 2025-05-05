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

interface ConversationData {
  participants: string[];
  approved: Record<string, boolean>;
}

export default function FriendsPage() {
  const router = useRouter();
  const user = auth.currentUser;
  const [friends, setFriends] = useState<Friend[]>([]);

  // 1) Subscribe to friends UIDs
  const [friendUids, setFriendUids] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    const friendsCol = collection(db, 'users', user.uid, 'friends');
    return onSnapshot(friendsCol, snap => {
      setFriendUids(snap.docs.map(d => d.id));
    });
  }, [user]);

  // 2) Subscribe to each friend's public profile and conv map
  useEffect(() => {
    if (!user) {
      setFriends([]);
      return;
    }
    if (friendUids.length === 0) {
      setFriends([]);
      return;
    }

    // First, listen to conversations
    const convCol = collection(db, 'conversations');
    const convQ   = query(convCol, where('participants', 'array-contains', user.uid));
    const convMapUnsub = onSnapshot(convQ, snap => {
      const convMap: Record<string,string> = {};
      snap.docs.forEach(d => {
        const data = d.data() as ConversationData;
        const meOk  = data.approved[user.uid] === true;
        const allOk = Object.values(data.approved).every(f => f === true);
        if (meOk && allOk) {
          const other = data.participants.find(id => id !== user.uid)!;
          convMap[other] = d.id;
        }
      });

      // Then, for each friend UID, fetch profile
      setFriends(prev => {
        // Keep order of friendUids
        return friendUids.map(uid => {
          // Check if already in prev
          const old = prev.find(f => f.uid === uid);
          const displayName = old?.displayName || '';
          const photoURL    = old?.photoURL    || '/default-avatar.png';
          return {
            uid,
            displayName,
            photoURL,
            convId: convMap[uid]
          };
        });
      });
    });

    // Now subscribe to publicKeys for profile updates
    const unsubProfiles = friendUids.map(uid => {
      const pkDoc = doc(db, 'publicKeys', uid);
      return onSnapshot(pkDoc, snap => {
        if (!snap.exists()) return;
        const data = snap.data()!;
        setFriends(prev => prev.map(f =>
          f.uid === uid
            ? { ...f,
                displayName: data.displayName || uid,
                photoURL:    data.photoURL    || '/default-avatar.png'
              }
            : f
        ));
      });
    });

    return () => {
      convMapUnsub();
      unsubProfiles.forEach(u => u());
    };
  }, [user, friendUids]);

  if (!user) return <p className="p-6">Loading…</p>;

  return (
    <div className="min-h-screen p-6 font-[family-name:var(--font-geist-mono)]">
      <h1 className="text-3xl font-semibold mb-6 text-center">Your Friends</h1>
      <p className="text-center text-gray-500 mb-4">You can add friends by their UID. If your friends list is stuck loading, make sure you&apos;ve put your passphrase in dashboard</p>

      {friends.length === 0 ? (
        <p className="text-center text-gray-500">You have no friends yet. Go to Search to add someone by UID!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {friends.map(f => (
            <div key={f.uid} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center">
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
                    await deleteDoc(doc(db, 'users', user.uid, 'friends', f.uid));
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
