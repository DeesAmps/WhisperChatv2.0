import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb as adminFirestore } from '../../../lib/firebaseAdmin';
import {FieldValue} from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  // authenticate
  const authHeader = req.headers.authorization || '';
  const match      = authHeader.match(/^Bearer (.*)$/);
  if (!match) return res.status(401).json({ error: 'Missing token' });

  let me: string;
  try {
    me = (await adminAuth.verifyIdToken(match[1])).uid;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { requesterUid, action } = req.body as { requesterUid?: string; action?: 'accept'|'decline' };
  if (!requesterUid || !['accept','decline'].includes(action!)) {
    return res.status(400).json({ error: 'Bad request' });
  }

  const reqRef = adminFirestore.doc(`users/${me}/friendRequests/${requesterUid}`);

  // Ensure the request exists
  const snap = await reqRef.get();
  if (!snap.exists) return res.status(404).json({ error: 'Request not found' });

  if (action === 'accept') {
    // 1) add to friends both sides
    const { displayName, photoURL } = snap.data()!;
    // your friend entry
    await adminFirestore
      .doc(`users/${me}/friends/${requesterUid}`)
      .set({ uid: requesterUid, displayName, photoURL, addedAt: FieldValue.serverTimestamp() });
    // reciprocal: you need my profile data
    const meDoc = await adminFirestore.doc(`publicKeys/${me}`).get();
    const meData = meDoc.exists ? meDoc.data()! : { displayName:'', photoURL:'' };
    await adminFirestore
      .doc(`users/${requesterUid}/friends/${me}`)
      .set({ uid: me, displayName: meData.displayName, photoURL: meData.photoURL, addedAt: FieldValue.serverTimestamp() });
  }

  // 2) delete the request doc
  await reqRef.delete();

  return res.status(200).json({ success: true });
}
