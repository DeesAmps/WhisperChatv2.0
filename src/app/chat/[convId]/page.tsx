'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
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
import { onAuthStateChanged, User } from 'firebase/auth';
import * as openpgp from 'openpgp';
import { usePrivateKey } from '../../../contexts/PrivateKeyContext';

interface Message {
  id: string;
  sender: string;
  cipherText: string;
  timestamp: { toDate: () => Date };
}

export default function ChatPage() {
  const params = useParams();
  const raw = params.convId;
  const convId = Array.isArray(raw) ? raw[0] : raw;

  const router = useRouter();
  const { privateKey, setPrivateKey } = usePrivateKey();

  const [user, setUser] = useState<User | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [otherPubKey, setOtherPubKey] = useState<openpgp.PublicKey | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; isMine: boolean }>>([]);
  const [input, setInput] = useState('');
  const [armoredInput, setArmoredInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1) Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else setUser(u);
    });
    return unsub;
  }, [router]);

  // 2) Check approval & load otherPubKey
  useEffect(() => {
    if (!user || !convId) return;
    (async () => {
      const convSnap = await getDoc(doc(db, 'conversations', convId));
      const data = convSnap.data();
      const ok = !!data?.approved?.[user.uid];
      setApproved(ok);
      if (!ok) return;
      const participants = data.participants as string[];
      const otherUid = participants.find((uid) => uid !== user.uid)!;
      const keySnap = await getDoc(doc(db, 'publicKeys', otherUid));
      const pubArmored = keySnap.data()!.publicKeyArmored as string;
      setOtherPubKey(await openpgp.readKey({ armoredKey: pubArmored }));
    })();
  }, [user, convId]);

  // 3) Subscribe to messages and decrypt
  useEffect(() => {
    if (!approved || !privateKey || !convId) return;
    const messagesRef = collection(db, 'conversations', convId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        const dec = await Promise.all(
          snap.docs.map(async (d) => {
            const m = d.data() as Message;
            const isMine = m.sender === user!.uid;
            const { data: text } = await openpgp.decrypt({
              message: await openpgp.readMessage({ armoredMessage: m.cipherText }),
              decryptionKeys: privateKey
            });
            return { id: d.id, text, isMine };
          })
        );
        setMessages(dec);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      },
      (err) => console.error('Subscription error:', err)
    );
    return unsub;
  }, [approved, privateKey, convId, user]);

  // 4) Send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !approved || !otherPubKey || !privateKey || !convId) return;
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: input }),
      encryptionKeys: otherPubKey,
      signingKeys: privateKey
    });
    await addDoc(
      collection(db, 'conversations', convId, 'messages'),
      { sender: user.uid, cipherText: encrypted, timestamp: serverTimestamp() }
    );
    setInput('');
  }

  async function ensureDecrypted(key: openpgp.PrivateKey): Promise<openpgp.PrivateKey> {
    try {
      // Attempt to decrypt with empty passphrase
      return await openpgp.decryptKey({ privateKey: key, passphrase: '' });
    } catch (err: unknown) {
      // If it’s already decrypted, just return it
      if (err instanceof Error && err.message.includes('already decrypted')) {
        return key;
      }
      throw err;
    }
  }

  // — RENDERING —  

  // 1) Not approved
  if (approved === false) {
    return <div className="p-8 text-center">🚫 You’re not approved for this chat.</div>;
  }

  // 2) Waiting for approval check or keys
  if (approved === null) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  // 3) Approved—but missing privateKey: prompt import
  if (approved && !privateKey) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h2 className="text-xl mb-2">Import Your Private Key</h2>
        <p className="mb-4 text-sm text-gray-600">
          Paste the PGP private key you generated at signup to decrypt messages.
        </p>
        <textarea
          className="w-full h-40 border rounded px-2 py-1 mb-2"
          value={armoredInput}
          onChange={e => setArmoredInput(e.target.value)}
        />
        <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={async () => {
                try {
                // Read the armored key
                const readKey = await openpgp.readPrivateKey({ armoredKey: armoredInput });
                // Decrypt or pass through via ensureDecrypted
                const usableKey = await ensureDecrypted(readKey);
                // Store the decrypted key (and its armored form)
                setPrivateKey(usableKey, armoredInput);
                } catch (err: unknown) {
                if (err instanceof Error && err.message.includes('already decrypted')) {
                    // Fallback: it truly is already decrypted
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

  // 4) Waiting for otherPubKey
  if (!otherPubKey) {
    return <div className="p-8 text-center">Loading chat…</div>;
  }

  // 5) Fully ready: chat UI
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map(m => (
          <div
            key={m.id}
            className={`max-w-md p-2 rounded ${
              m.isMine ? 'bg-blue-100 self-end' : 'bg-gray-200'
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex p-4 space-x-2">
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
