import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb as adminFirestore } from '../../../lib/firebaseAdmin';
import {FieldValue} from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  // 1) authenticate
  const authHeader = req.headers.authorization || '';
  const match      = authHeader.match(/^Bearer (.*)$/);
  if (!match) return res.status(401).json({ error: 'Missing token' });

  let me: string;
  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    me = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 2) extract targetUid
  const { targetUid } = req.body as { targetUid?: string };
  if (!targetUid || targetUid === me) {
    return res.status(400).json({ error: 'Invalid targetUid' });
  }

  // 3) fetch my profile snapshot from publicKeys
  const meDoc = await adminFirestore.doc(`publicKeys/${me}`).get();
  if (!meDoc.exists) return res.status(404).json({ error: 'Your profile not found' });
  const { displayName = '', photoURL = '' } = meDoc.data()!;

  // 4) write incoming request under /users/targetUid/friendRequests/me
  await adminFirestore
    .doc(`users/${targetUid}/friendRequests/${me}`)
    .set({
      uid: me,
      displayName,
      photoURL,
      sentAt: FieldValue.serverTimestamp()
    });

  res.status(200).json({ success: true });
}
