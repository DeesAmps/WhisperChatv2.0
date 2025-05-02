// src/pages/api/conversations.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid auth header' });
  }
  let uid: string;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // GET pending
  if (req.method === 'GET' && req.query.mode === 'pending') {
    const snap = await adminDb
      .collection('conversations')
      .where(`approved.${uid}`, '==', false)
      .get();
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json(convs);
  }

  // PATCH approve
  if (req.method === 'PATCH') {
    const { convId } = req.body;
    if (!convId) {
      return res.status(400).json({ error: 'Missing convId' });
    }
    await adminDb
      .collection('conversations')
      .doc(convId)
      .update({ [`approved.${uid}`]: true });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET','PATCH']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
