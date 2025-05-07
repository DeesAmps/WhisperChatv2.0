// src/app/chat/[convId]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import FriendsList from '../../../components/FriendsList';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import * as openpgp from 'openpgp';
import { usePrivateKey } from '../../../contexts/PrivateKeyContext';
import Image from 'next/image';



// UI‐ready shape
interface ChatMessage {
  id:        string;
  sender:    string;
  text:      string;
  isMine:    boolean;
  timestamp: Date;
  readBy:    string[];
}
interface Profile {
  displayName: string;
  photoURL: string;
}

export default function ChatPage() {
  // — Hooks & State —
  const { privateKey, setPrivateKey } = usePrivateKey();
  const [user, setUser]               = useState<User | null>(null);
  const [approved, setApproved]       = useState<boolean | null>(null);
  const [otherPubKey, setOtherPubKey] = useState<openpgp.PublicKey | null>(null);
  const [myPubKey, setMyPubKey]       = useState<openpgp.PublicKey | null>(null);
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [input, setInput]             = useState('');
  const [armoredInput, setArmoredInput] = useState('');
  const [profiles, setProfiles]       = useState<Record<string, Profile>>({});
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
       
      // --- NEW: fetch and cache each participant's profile ---
      const docs = await Promise.all(
          participants.map(uid => getDoc(doc(db, 'publicKeys', uid)))
        );
        const profMap: Record<string, Profile> = {};
        participants.forEach((uid, i) => {
          const d = docs[i].data();
          profMap[uid] = {
            displayName: d?.displayName || uid.slice(0,6),
            photoURL:    d?.photoURL    || '/default-avatar.png'
          };
        });
        setProfiles(profMap);
        // -----------------------------------------------
    })();
  }, [user, convId]);

    // 3) Subscribe & decrypt messages
    useEffect(() => {
      if (!approved || !privateKey || !convId) return;
      const ref = collection(db, 'conversations', convId, 'messages');
      const q   = query(ref, orderBy('timestamp'));

      const unsub = onSnapshot(q, async snap => {
        // 1) First, mark any unread incoming messages as read
        await Promise.all(
          snap.docs.map(async d => {
            const raw = d.data() as { sender: string; readBy?: string[] };
            const isMine = raw.sender === user!.uid;
            const haveRead = Array.isArray(raw.readBy) ? raw.readBy : [];

            if (!isMine && !haveRead.includes(user!.uid)) {
              // append this user to readBy
              await updateDoc(
                doc(db, 'conversations', convId, 'messages', d.id),
                { readBy: arrayUnion(user!.uid) }
              );
            }
          })
        ).catch(console.error);

        // 2) Then decrypt & map to your ChatMessage shape
        const dec = await Promise.all(
          snap.docs.map(async d => {
            const raw = d.data() as {
              sender:     string;
              cipherText: string;
              timestamp?: { toDate: () => Date } | null;
              readBy?:    string[];
            };

            const isMine = raw.sender === user!.uid;

            // decrypt…
            let text: string;
            try {
              const msg = await openpgp.readMessage({ armoredMessage: raw.cipherText });
              const { data } = await openpgp.decrypt({
                message:        msg,
                decryptionKeys: privateKey
              });
              text = data;
            } catch {
              text = "[Unable to decrypt]";
            }

            // timestamp fallback
            const when = raw.timestamp?.toDate?.() ?? new Date();
            // ensure an array
            const readBy = Array.isArray(raw.readBy) ? raw.readBy : [];

            return {
              id:        d.id,
              sender:    raw.sender,
              text,
              isMine,
              timestamp: when,
              readBy
            };
          })
        );

        setMessages(dec);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      },
      err => console.error('Subscription error:', err));

      return unsub;
    }, [approved, privateKey, convId, user]);

  // — Early‐Return Guards —

  // If convId not available yet
  if (!convId) {
    return <div className="p-8 text-center">Loading chat…</div>;
  }

  // Not approved
  if (approved === false) {
    return <div className="p-8 text-center">🚫 Youre not approved for this chat.</div>;
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
    <div className="flex h-full">
      {/* Sidebar */}
      <FriendsList />
  
      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        {/* Message list */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map(m => {
            const timeString = m.timestamp.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit'
            });
            const otherUid   = Object.keys(profiles).find(uid => uid !== user!.uid)!;
            const wasRead    = m.isMine && m.readBy.includes(otherUid);

            return (
              <div key={m.id} className="flex flex-col space-y-1">
                <div className={`flex items-start space-x-2 ${m.isMine ? 'justify-end' : ''}`}>
                  <Image
                     src={profiles[m.sender]?.photoURL || '/default-avatar.png'}
                     alt={profiles[m.sender]?.displayName || m.sender.slice(0,6)}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div className={`mt-1 p-2 rounded ${
                    m.isMine
                      ? 'bg-blue-100 text-gray-900 dark:bg-blue-800 dark:text-blue-100'
                      : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
                <div className={`text-xs text-gray-500 ${m.isMine ? 'text-right pr-10' : 'pl-10'}`}>
                  {timeString}
                  {m.isMine && <span className="ml-2">{wasRead ? '✓✓' : '✓'}</span>}
                </div>
              </div>

            );
          })}
          <div ref={bottomRef} />
        </div>
  
        {/* Input form */}
        <form
          onSubmit={async e => {
            e.preventDefault();
            if (!user || !approved || !otherPubKey || !myPubKey || !privateKey) return;
            const encrypted = await openpgp.encrypt({
              message: await openpgp.createMessage({ text: input }),
              encryptionKeys: [otherPubKey, myPubKey],
              signingKeys: privateKey
            });
            await addDoc(
              collection(db, 'conversations', convId, 'messages'),
              { sender: user.uid, cipherText: encrypted, timestamp: serverTimestamp(), readBy: [user.uid] } 
            );
            setInput('');
          }}
          className="flex p-4 space-x-2 border-t border-gray-200"
        >
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
    </div>
  );
  
}
 