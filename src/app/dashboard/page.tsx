// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';

interface Conversation {
  id: string;
}

export default function DashboardPage() {
  const [pending, setPending] = useState<Conversation[]>([]);
  const [chats, setChats]       = useState<Conversation[]>([]);
  const [loading, setLoading]   = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) {
        router.push('/login');
      } else {
        fetchLists();
      }
    });
    return unsub;
  }, [router]);

  async function fetchLists() {
    setLoading(true);
    const token = await auth.currentUser!.getIdToken();

    // Fetch pending requests
    const pRes = await fetch('/api/conversations?mode=pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pendingList: Conversation[] = pRes.ok ? await pRes.json() : [];
    if (!pRes.ok) console.error('Pending fetch error:', await pRes.text());

    // Fetch approved chats
    const aRes = await fetch('/api/conversations?mode=approved', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const approvedList: Conversation[] = aRes.ok ? await aRes.json() : [];
    if (!aRes.ok) console.error('Approved fetch error:', await aRes.text());

    setPending(pendingList);
    setChats(approvedList);
    setLoading(false);
  }

  async function approve(convId: string) {
    const token = await auth.currentUser!.getIdToken();
    const res = await fetch('/api/conversations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ convId })
    });
    if (res.ok) {
      // remove from pending, add to chats
      setPending(p => p.filter(c => c.id !== convId));
      setChats(c => [...c, { id: convId }]);
    } else {
      console.error('Approve error:', await res.text());
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-mono)] w-full">
      {/* Pending Requests */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Pending Requests</h2>
        {pending.length === 0 ? (
          <p>No pending conversation requests.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map(c => (
              <li
                key={c.id}
                className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-md px-4 py-2"
              >
                <span className="font-mono">{c.id}</span>
                <button
                  onClick={() => approve(c.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Your Chats */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Your Chats</h2>
        {chats.length === 0 ? (
          <p>You have no approved chats yet.</p>
        ) : (
          <ul className="space-y-2">
            {chats.map(c => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="font-mono text-blue-600 hover:underline"
                >
                  Chat {c.id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
