'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
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

  // 1) Subscribe to auth state using your initialized `auth`
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/');
      } else {
        loadPending(user);
      }
    });
    return unsubscribe;
  }, [router]);

  // 2) Fetch pending via your API
  async function loadPending(user: User) {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/conversations?mode=pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error('Failed to load pending:', await res.text());
        return;
      }
      setPending(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // 3) Approve via your API
  async function approve(convId: string) {
    const user = auth.currentUser!;
    const token = await user.getIdToken();
    const res = await fetch('/api/conversations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ convId }),
    });
    if (!res.ok) {
      console.error('Approve failed:', await res.text());
      return;
    }
    setPending((p) => p.filter((c) => c.id !== convId));
  }

  if (loading) return <div>Loading…</div>;
  if (!pending.length) return <div>No pending conversation requests.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>Pending Conversations</h1>
      <ul>
        {pending.map((conv) => (
          <li key={conv.id} style={{ marginBottom: '1rem' }}>
            <strong>{conv.id}</strong>
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
