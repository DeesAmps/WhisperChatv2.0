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
  const convIdRaw = params.convId;
  const convId = Array.isArray(convIdRaw) ? convIdRaw[0] : convIdRaw;

  const router = useRouter();
  const { privateKey } = usePrivateKey();
  const [user, setUser] = useState<User | null>(null);
  const [otherPubKey, setOtherPubKey] = useState<openpgp.PublicKey | null>(null);
  const [messages, setMessages] = useState<
    Array<{ id: string; text: string; isMine: boolean }>
  >([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1) Subscribe to auth state, redirect if signed-out
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/');
      } else {
        setUser(u);
      }
    });
    return unsub;
  }, [router]);

  // 2) Once we have a signed-in user + convId, load the other user's public key
  useEffect(() => {
    if (!user || !convId) return;
    (async () => {
      const me = user.uid;
      const convRef = doc(db, 'conversations', convId);
      const convSnap = await getDoc(convRef);
      const participants = (convSnap.data()?.participants || []) as string[];
      const otherUid = participants.find((uid) => uid !== me);
      if (!otherUid) return;

      const keyRef = doc(db, 'publicKeys', otherUid);
      const keySnap = await getDoc(keyRef);
      const pubArmored = keySnap.data()?.publicKeyArmored as string;
      const pubKey = await openpgp.readKey({ armoredKey: pubArmored });
      setOtherPubKey(pubKey);
    })();
  }, [user, convId]);

  // 3) Once we have a private key, convId, and a signed-in user, subscribe & decrypt
  useEffect(() => {
    if (!user || !privateKey || !convId) return;
    const messagesRef = collection(db, 'conversations', convId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));

    const unsub = onSnapshot(q, async (snap) => {
      const decrypted = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const m = docSnap.data() as Message;
          const isMine = m.sender === user.uid;
          const { data: text } = await openpgp.decrypt({
            message: await openpgp.readMessage({
              armoredMessage: m.cipherText
            }),
            decryptionKeys: privateKey
          });
          return { id: docSnap.id, text, isMine };
        })
      );
      setMessages(decrypted);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return unsub;
  }, [user, privateKey, convId]);

  // 4) Send
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !otherPubKey || !privateKey || !convId) return;
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: input }),
      encryptionKeys: otherPubKey,
      signingKeys: privateKey
    });
    const messagesRef = collection(db, 'conversations', convId, 'messages');
    await addDoc(messagesRef, {
      sender: user.uid,
      cipherText: encrypted,
      timestamp: serverTimestamp()
    });
    setInput('');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map((m) => (
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
          onChange={(e) => setInput(e.target.value)}
          disabled={!otherPubKey}
          placeholder="Type a message…"
        />
        <button
          type="submit"
          className="px-4 rounded bg-green-600 text-white disabled:opacity-50"
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
