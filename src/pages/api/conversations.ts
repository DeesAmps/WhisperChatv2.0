// src/pages/api/conversations.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Authenticate incoming request via Bearer token
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

  // 2) POST → create a new conversation request
  if (req.method === 'POST') {
    const { participants } = req.body as { participants?: string[] };
    if (
      !Array.isArray(participants) ||
      participants.length !== 2 ||
      !participants.includes(uid)
    ) {
      return res
        .status(400)
        .json({ error: 'Must supply participants array of two UIDs including yourself' });
    }

    const approved: Record<string, boolean> = {};
    participants.forEach((p) => {
      approved[p] = p === uid;  // auto‑approve yourself, leave the other pending
    });

    const convRef = adminDb.collection('conversations').doc();
    await convRef.set({ participants, approved });
    return res.status(201).json({ convId: convRef.id });
  }

  // 3) GET pending → return all convs where approved[uid] === false
  if (req.method === 'GET' && req.query.mode === 'pending') {
    const snap = await adminDb
      .collection('conversations')
      .where(`approved.${uid}`, '==', false)
      .get();
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json(convs);
  }

  // 4) PATCH approve → set approved[uid] = true
  if (req.method === 'PATCH') {
    const { convId } = req.body as { convId?: string };
    if (!convId) {
      return res.status(400).json({ error: 'Missing convId in body' });
    }
    await adminDb
      .collection('conversations')
      .doc(convId)
      .update({ [`approved.${uid}`]: true });
    return res.status(200).json({ success: true });
  }

  // 5) Fallback for unsupported methods
  res.setHeader('Allow', ['GET','POST','PATCH']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
