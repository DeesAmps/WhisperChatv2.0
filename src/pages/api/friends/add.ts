// src/pages/api/friends/add.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth as adminAuth, adminDb as adminFirestore } from '../../../lib/firebaseAdmin';
import {FieldValue} from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // 1) Authenticate the caller (example: Firebase ID token in Authorization header)
  const authHeader = req.headers.authorization || '';
  const match      = authHeader.match(/^Bearer (.*)$/);
  if (!match) return res.status(401).json({ error: 'Missing auth token' });
  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  // 2) Extract friendUid
  const { friendUid } = req.body as { friendUid?: string };
  if (!friendUid) {
    return res.status(400).json({ error: 'friendUid is required' });
  }

  // 3) Fetch friend’s profile snapshot
  const pkDoc = await adminFirestore.doc(`publicKeys/${friendUid}`).get();
  if (!pkDoc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { displayName = '', photoURL = '' } = pkDoc.data()!;

  // 4) Write to friends sub‑collection
  await adminFirestore
    .doc(`users/${uid}/friends/${friendUid}`)
    .set({
      uid:         friendUid,
      displayName,
      photoURL,
      addedAt: FieldValue.serverTimestamp()
    });

  return res.status(200).json({ success: true });
}
