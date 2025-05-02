'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import React from 'react';

interface Conversation {
  id: string;
  participants: string[];
  approved: Record<string, boolean>;
}

export default function DashboardPage() {
  const [pending, setPending] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Redirect to signup/login if not authenticated
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), user => {
      if (!user) router.push('/');
      else fetchPending(user.uid);
    });
    return unsub;
  }, [router]);

  // Fetch all conversations where approved[currentUid] == false
  async function fetchPending(uid: string) {
    setLoading(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      where(`approved.${uid}`, '==', false)
    );
    const snap = await getDocs(q);
    const convs = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Conversation, 'id'>)
    }));
    setPending(convs);
    setLoading(false);
  }

  // Approve a conversation
  async function approve(convId: string) {
    const user = getAuth().currentUser;
    if (!user) return;
    const convRef = doc(db, 'conversations', convId);
    await updateDoc(convRef, {
      [`approved.${user.uid}`]: true
    });
    // Remove it from the list
    setPending(p => p.filter(c => c.id !== convId));
  }

  if (loading) return <div>Loading…</div>;
  if (pending.length === 0)
    return <div>No pending conversation requests.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>Pending Conversations</h1>
      <ul>
        {pending.map(conv => (
          <li key={conv.id} style={{ marginBottom: '1rem' }}>
            <span>
              Conversation ID: <strong>{conv.id}</strong>
            </span>
            <button
              style={{ marginLeft: '1rem' }}
              onClick={() => approve(conv.id)}
            >
              Approve
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
