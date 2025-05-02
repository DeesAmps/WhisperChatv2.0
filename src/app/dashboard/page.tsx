// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {auth} from '../../lib/firebase';

interface Conversation {
  id: string;
}

export default function DashboardPage() {
  const [pending, setPending] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) {
        router.push('/');
      } else {
        fetchPending();
      }
    });
    return unsub;
  }, [router]);

  async function fetchPending() {
    setLoading(true);
    const user = auth.currentUser!;
    const token = await user.getIdToken();
    const res = await fetch('/api/conversations?mode=pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const convs: Conversation[] = (await res.json()) || [];
    setPending(convs);
    setLoading(false);
  }

  async function approve(convId: string) {
    const user = auth.currentUser!;
    const token = await user.getIdToken();
    await fetch('/api/conversations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ convId })
    });
    setPending(p => p.filter(c => c.id !== convId));
  }

  if (loading) return <div>Loading…</div>;
  if (pending.length === 0) return <div>No pending chats.</div>;

  return (
    <div className="
      flex flex-col gap-[32px]
      items-center sm:items-start
      font-[family-name:var(--font-geist-mono)]
      w-full
    ">
      <h1 className="text-2xl font-semibold mb-2">Pending Conversations</h1>
      <ul className="w-full space-y-2">
        {pending.map(c => (
          <li
            key={c.id}
            className="
              flex justify-between items-center
              border border-gray-200 dark:border-gray-700
              rounded-md px-4 py-2
            "
          >
            <span className="font-mono">{c.id}</span>
            <button
              onClick={() => approve(c.id)}
              className="
                rounded-full h-10 px-4
                bg-green-600 hover:bg-green-700
                text-white font-medium text-sm
                transition-colors
              "
            >
              Approve
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
