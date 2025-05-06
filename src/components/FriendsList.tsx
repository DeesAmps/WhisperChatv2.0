// src/app/components/FriendsList.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  query,
  where,
  DocumentData,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export interface Friend {
  uid: string;
  displayName: string;
  photoURL: string;
}

// shape of our conversations in Firestore
interface ConversationData {
  participants: string[];
  approved: Record<string, boolean>;
}

export default function FriendsList() {
  const router = useRouter();
  const user = auth.currentUser;

  // 1) just the UIDs of friends
  const [friendUids, setFriendUids] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setFriendUids([]);
      return;
    }
    const friendsCol = collection(db, 'users', user.uid, 'friends');
    const unsub = onSnapshot(friendsCol, snap => {
      setFriendUids(snap.docs.map(d => d.id));
    });
    return unsub;
  }, [user]);

  // 2) subscribe to each friend's publicKeys for live profile updates
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    if (!user || friendUids.length === 0) {
      setFriends([]);
      return;
    }

    const unsubscribes = friendUids.map(uid => {
      const pkDoc = doc(db, 'publicKeys', uid);
      return onSnapshot(pkDoc, snap => {
        const data = snap.data() as DocumentData;
        // build new Friend entry
        const updated: Friend = {
          uid,
          displayName: typeof data.displayName === 'string' ? data.displayName : uid,
          photoURL:    typeof data.photoURL    === 'string' ? data.photoURL    : '/default-avatar.png',
        };
        setFriends(prev => {
          const exists = prev.findIndex(f => f.uid === uid);
          if (exists >= 0) {
            const next = [...prev];
            next[exists] = updated;
            return next;
          }
          return [...prev, updated];
        });
      });
    });

    return () => unsubscribes.forEach(u => u());
  }, [user, friendUids]);

  // 3) map of fully‑approved conversations: otherUid → convId
  const [convMap, setConvMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      setConvMap({});
      return;
    }
    const convCol = collection(db, 'conversations');
    const q = query(convCol, where('participants', 'array-contains', user.uid));
    const unsub = onSnapshot(q, snap => {
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data() as ConversationData;
        const approvedSelf  = data.approved[user.uid] === true;
        const allApproved   = Object.values(data.approved).every(flag => flag === true);
        if (approvedSelf && allApproved) {
          const other = data.participants.find(id => id !== user.uid);
          if (other) map[other] = d.id;
        }
      });
      setConvMap(map);
    });
    return unsub;
  }, [user]);

  // navigate to an existing conv
  const startChat = (convId: string) => {
    router.push(`/chat/${convId}`);
  };

  if (!user) return null;

  return (
    <nav className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Friends</h2>
      {friends.length === 0 ? (
        <p className="text-sm text-gray-500">You have no friends yet.</p>
      ) : (
        <ul className="space-y-3">
          {friends.map(f => (
            <li
              key={f.uid}
              className="flex items-center justify-between space-x-3"
            >
              <div
                className={`flex items-center space-x-3 cursor-pointer ${
                  convMap[f.uid] ? 'hover:bg-gray-100' : 'opacity-50'
                }`}
                onClick={() => {
                  const cid = convMap[f.uid];
                  if (cid) startChat(cid);
                }}
              >
                <Image 
                    src ={f.photoURL}
                    alt={f.displayName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                />
                <span className="flex-1 text-sm font-medium">
                  {f.displayName || f.uid}
                </span>
              </div>
              {convMap[f.uid] && (
                <button
                  onClick={() => startChat(convMap[f.uid])}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Chat
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
