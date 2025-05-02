// src/app/chat/[convId]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import * as openpgp from 'openpgp';
import { usePrivateKey } from '../../../contexts/PrivateKeyContext';

interface Message {
  id: string;
  sender: string;
  cipherText: string;
  timestamp: { toDate: () => Date };
}

export default function ChatPage() {
  // — Hooks & State —
  const { privateKey, setPrivateKey } = usePrivateKey();
  const [user, setUser]               = useState<User | null>(null);
  const [approved, setApproved]       = useState<boolean | null>(null);
  const [otherPubKey, setOtherPubKey] = useState<openpgp.PublicKey | null>(null);
  const [myPubKey, setMyPubKey]       = useState<openpgp.PublicKey | null>(null);
  const [messages, setMessages]       = useState<{ id: string; text: string; isMine: boolean }[]>([]);
  const [input, setInput]             = useState('');
  const [armoredInput, setArmoredInput] = useState('');
  const bottomRef                     = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const params = useParams();
  const raw    = params?.convId;
  const convId = typeof raw === 'string'
    ? raw
    : Array.isArray(raw)
      ? raw[0]
      : '';

  // Decrypt‐helper that ignores “already decrypted”
  async function ensureDecrypted(key: openpgp.PrivateKey): Promise<openpgp.PrivateKey> {
    try {
      return await openpgp.decryptKey({ privateKey: key, passphrase: '' });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('already decrypted')) {
        return key;
      }
      throw err;
    }
  }

  // — Effects —

  // 1) Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) router.push('/login');
      else setUser(u);
    });
    return unsub;
  }, [router]);

  // 2) Load approval & public keys
  useEffect(() => {
    if (!user || !convId) return;
    (async () => {
      const convSnap = await getDoc(doc(db, 'conversations', convId));
      const data = convSnap.data();
      const ok = !!data?.approved?.[user.uid];
      setApproved(ok);
      if (!ok) return;

      const participants = data.participants as string[];
      const otherUid     = participants.find(uid => uid !== user.uid)!;

      // Other's public key
      const otherSnap = await getDoc(doc(db, 'publicKeys', otherUid));
      const otherArm  = otherSnap.data()!.publicKeyArmored as string;
      setOtherPubKey(await openpgp.readKey({ armoredKey: otherArm }));

      // Your public key (for self‐decrypt)
      const mineSnap = await getDoc(doc(db, 'publicKeys', user.uid));
      const myArm     = mineSnap.data()!.publicKeyArmored as string;
      setMyPubKey(await openpgp.readKey({ armoredKey: myArm }));
    })();
  }, [user, convId]);

  // 3) Subscribe & decrypt messages
  useEffect(() => {
    if (!approved || !privateKey || !convId) return;
    const ref = collection(db, 'conversations', convId, 'messages');
    const q   = query(ref, orderBy('timestamp'));

    const unsub = onSnapshot(
      q,
      async snap => {
        const dec = await Promise.all(
          snap.docs.map(async d => {
            const { sender, cipherText } = d.data() as Message;
            const isMine = sender === user!.uid;
            try {
              const { data: text } = await openpgp.decrypt({
                message: await openpgp.readMessage({ armoredMessage: cipherText }),
                decryptionKeys: privateKey
              });
              return { id: d.id, text, isMine };
            } catch {
              return { id: d.id, text: '[Unable to decrypt]', isMine };
            }
          })
        );
        setMessages(dec);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      },
      err => console.error('Subscription error:', err)
    );

    return unsub;
  }, [approved, privateKey, convId, user]);

  // — Early‐Return Guards —

  // If convId not available yet
  if (!convId) {
    return <div className="p-8 text-center">Loading chat…</div>;
  }

  // Not approved
  if (approved === false) {
    return <div className="p-8 text-center">🚫 You’re not approved for this chat.</div>;
  }

  // Approved but missing decrypted private key
  if (approved && !privateKey) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h2 className="text-xl mb-2">Import Your Private Key</h2>
        <p className="mb-4 text-sm text-gray-600">
          Paste the PGP private key you generated at signup.
        </p>
        <textarea
          className="w-full h-40 border rounded px-2 py-1 mb-2 font-mono text-xs"
          value={armoredInput}
          onChange={e => setArmoredInput(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={async () => {
            try {
              const readKey   = await openpgp.readPrivateKey({ armoredKey: armoredInput });
              const usableKey = await ensureDecrypted(readKey);
              setPrivateKey(usableKey, armoredInput);
            } catch (err: unknown) {
              if (err instanceof Error && err.message.includes('already decrypted')) {
                const readKey = await openpgp.readPrivateKey({ armoredKey: armoredInput });
                setPrivateKey(readKey, armoredInput);
              } else {
                alert('Invalid private key. Please paste it correctly.');
              }
            }
          }}
        >
          Import Key
        </button>
      </div>
    );
  }

  // Waiting on public keys
  if (!otherPubKey || !myPubKey) {
    return <div className="p-8 text-center">Loading chat…</div>;
  }

  // — Final Chat UI —
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map(m => (
          <div
            key={m.id}
            className={`max-w-md p-2 rounded break-words ${
              m.isMine
                ? 'bg-blue-100 text-gray-900 dark:bg-blue-800 dark:text-blue-100 self-end'
                : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={async e => {
        e.preventDefault();
        if (!user || !approved || !otherPubKey || !myPubKey || !privateKey) return;
        const encrypted = await openpgp.encrypt({
          message: await openpgp.createMessage({ text: input }),
          encryptionKeys: [otherPubKey, myPubKey],
          signingKeys: privateKey
        });
        await addDoc(collection(db, 'conversations', convId, 'messages'), {
          sender: user.uid,
          cipherText: encrypted,
          timestamp: serverTimestamp()
        });
        setInput('');
      }} className="flex p-4 space-x-2">
        <input
          className="flex-1 border border-gray-300 rounded px-3 py-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message…"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 rounded bg-green-600 text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
