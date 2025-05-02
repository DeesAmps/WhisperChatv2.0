// src/app/search/page.tsx
'use client';

import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { db } from '../../lib/firebase';

export default function SearchPage() {
  const [targetUid, setTargetUid] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Checking user…');

    // Prevent self
    const me = getAuth().currentUser!;
    if (targetUid === me.uid) {
      setStatus("❌ Can't chat with yourself");
      return;
    }

    // Verify user exists
    const pubSnap = await getDoc(doc(db, 'publicKeys', targetUid));
    if (!pubSnap.exists()) {
      setStatus('User not found');
      return;
    }

    // Send request
    setStatus('Sending request…');
    const token = await me.getIdToken();
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ participants: [me.uid, targetUid] })
    });
    if (!res.ok) {
      setStatus('Error: ' + (await res.text()));
      return;
    }
    const { convId } = await res.json();
    setStatus(`✅ Request sent! Conversation ID: ${convId}`);
  }

  return (
    <div className="
      flex flex-col gap-[32px]
      items-center sm:items-start
      font-[family-name:var(--font-geist-mono)]
    ">
      <h1 className="text-2xl font-semibold mb-2">Start a Chat</h1>
      <form onSubmit={handleRequest} className="space-y-4 w-full">
        <label className="block">
          <span>Friend’s UID</span>
          <input
            type="text"
            className="
              mt-1 block w-full border border-gray-300 rounded-md
              px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
            value={targetUid}
            onChange={e => setTargetUid(e.target.value.trim())}
            required
          />
        </label>
        <button
          type="submit"
          className="
            w-full h-10 rounded-full
            bg-foreground text-background font-medium text-sm
            hover:bg-[#383838] dark:hover:bg-[#ccc]
            transition-colors
          "
        >
          Send Request
        </button>
      </form>
      {status && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-4">
          {status}
        </p>
      )}
    </div>
  );
}
