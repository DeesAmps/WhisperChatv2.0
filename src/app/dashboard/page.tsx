// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';

interface Conversation { id: string; }

export default function DashboardPage() {
  const [user, setUser]       = useState<User|null>(null);
  const [pending, setPending] = useState<Conversation[]>([]);
  const [chats, setChats]     = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1) Watch auth state once on mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) {
        router.push('/login');
      } else {
        setUser(u);
      }
    });
    return unsub;
  }, [router]);

  // 2) When `user` becomes non-null, fetch lists *once*
  useEffect(() => {
    if (!user) return;

    let isActive = true; // guard against unmounts
    (async () => {
      setLoading(true);
      const token = await user.getIdToken();

      const [pRes, aRes] = await Promise.all([
        fetch('/api/conversations?mode=pending', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/conversations?mode=approved', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const pendingList: Conversation[] = pRes.ok ? await pRes.json() : [];
      const approvedList: Conversation[] = aRes.ok ? await aRes.json() : [];

      if (!pRes.ok) console.error('Pending fetch error:', await pRes.text());
      if (!aRes.ok) console.error('Approved fetch error:', await aRes.text());

      if (isActive) {
        setPending(pendingList);
        setChats(approvedList);
        setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [user]);

  // 3) Approve handler (unchanged)
  async function approve(convId: string) {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch('/api/conversations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ convId })
    });
    if (res.ok) {
      setPending(ps => ps.filter(c => c.id !== convId));
      setChats(cs => [...cs, { id: convId }]);
    } else {
      console.error('Approve error:', await res.text());
    }
  }

  // 4) UID copy (unchanged)
  const copyUid = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    alert('UID copied to clipboard!');
  };

  if (loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-mono)] w-full max-w-lg mx-auto p-4">
      {user && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
          <h2 className="text-lg font-medium mb-2">Your UID</h2>
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 font-mono text-sm text-gray-900 dark:text-gray-100">
            <span className="truncate">{user.uid}</span>
            <button
              onClick={copyUid}
              className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Copy
            </button>
          </div>
        </section>
      )}

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
