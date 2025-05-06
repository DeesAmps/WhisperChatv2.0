// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { usePrivateKey } from '../../contexts/PrivateKeyContext';
import * as openpgp from 'openpgp';

interface Conversation { id: string; }

export default function DashboardPage() {
  // — Private‑Key Unlock State —
  const { privateKey, setPrivateKey } = usePrivateKey();
  const [unlocking, setUnlocking]     = useState(false);
  const [passphrase, setPassphrase]   = useState('');
  const [unlockError, setUnlockError] = useState<string|null>(null);

  // — Auth + Data State —
  const [user, setUser]       = useState<User|null>(null);
  const [pending, setPending] = useState<Conversation[]>([]);
  const [chats, setChats]     = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1) Watch auth state
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

  // 2) Fetch pending & approved once user is set
  useEffect(() => {
    if (!user) return;
    let active = true;
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
      if (active) {
        setPending(pendingList);
        setChats(approvedList);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  // 3) Approve handler
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

  // — Unlock‑Key UI —
  const armored = typeof window !== 'undefined'
    ? localStorage.getItem('privateKeyArmored')
    : null;

  if (user && armored && !privateKey) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4 font-[family-name:var(--font-geist-mono)]">
        <h2 className="text-xl font-semibold">Unlock Your Private Key</h2>
        <p className="text-sm text-gray-700">
          Enter the passphrase you chose to unlock your PGP key and access your chats.
        </p>
        {unlockError && (
          <p className="text-red-600 text-sm">{unlockError}</p>
        )}
        <input
          type="password"
          placeholder="PGP passphrase"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          disabled={unlocking}
        />
        <button
          onClick={async () => {
            setUnlocking(true);
            setUnlockError(null);
            try {
              const readKey = await openpgp.readPrivateKey({ armoredKey: armored! });
              const decryptedKey = await openpgp.decryptKey({
                privateKey: readKey,
                passphrase
              });
              setPrivateKey(decryptedKey, armored!);
            } catch {
              setUnlockError('Incorrect passphrase');
            } finally {
              setUnlocking(false);
            }
          }}
          disabled={unlocking || !passphrase.trim()}
          className="w-full h-10 rounded-full bg-foreground text-background font-medium hover:bg-[#383838] disabled:opacity-50 transition-colors"
        >
          {unlocking ? 'Unlocking…' : 'Unlock Key'}
        </button>
      </div>
    );
  }

  // — Loading State —
  if (loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  // — Main Dashboard UI —
  return (
    <div className="space-y-8 font-[family-name:var(--font-geist-mono)] w-full max-w-lg mx-auto p-4">
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
