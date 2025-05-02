'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function SearchPage() {
  const [targetUid, setTargetUid] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Checking user…');

    // 1) Verify the target exists (public key must exist)
    const pubSnap = await getDoc(doc(db, 'publicKeys', targetUid));
    if (!pubSnap.exists()) {
      setStatus('User not found');
      return;
    }

    // 2) Call your API to create the conversation
    setStatus('Sending request…');
    const user = getAuth().currentUser!;
    const token = await user.getIdToken();
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ participants: [user.uid, targetUid] }),
    });

    if (!res.ok) {
      const err = await res.text();
      setStatus('Error: ' + err);
      return;
    }

    const { convId } = await res.json();
    setStatus(`Request sent! Conversation ID: ${convId}`);
    // (Optional) redirect into the chat if you want
    // router.push(`/chat/${convId}`);
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h1>Start a Chat</h1>
      <form onSubmit={handleRequest}>
        <label>
          Friend’s UID
          <input
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value.trim())}
            placeholder="Enter their UID"
            required
          />
        </label>
        <button type="submit" style={{ marginTop: '1rem' }}>
          Send Request
        </button>
      </form>
      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
    </div>
  );
}
