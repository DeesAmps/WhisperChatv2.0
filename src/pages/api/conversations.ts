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
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Only allow two participants, one must be the caller
  if (req.method === 'POST') {
    const { participants } = req.body as { participants?: string[] };
    if (
      !Array.isArray(participants) ||
      participants.length !== 2 ||
      !participants.includes(uid)
    ) {
      return res.status(400).json({
        error: 'Must supply participants array of two UIDs including yourself'
      });
    }

    // --- sanitize UIDs ---
    const uidRegex = /^[A-Za-z0-9_-]{20,}$/;
    if (!participants.every(p => uidRegex.test(p))) {
      return res.status(400).json({ error: 'One or more UIDs are invalid' });
    }

    // Check for existing conversation
    const otherUid = participants.find(p => p !== uid)!;
    const existingSnap = await adminDb
      .collection('conversations')
      .where('participants', 'array-contains', uid)
      .get();

    for (const d of existingSnap.docs) {
      const data = d.data();
      if (
        Array.isArray(data.participants) &&
        data.participants.includes(otherUid)
      ) {
        return res.status(200).json({ convId: d.id });
      }
    }

    // No existing → create a fresh convo
    // Use a null‑prototype object to prevent prototype pollution
    const approved: Record<string, boolean> = Object.create(null);
    participants.forEach(p => {
      approved[p] = (p === uid);
    });

    const convRef = adminDb.collection('conversations').doc();
    await convRef.set({ participants, approved });

    return res.status(201).json({ convId: convRef.id });
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

  // GET approved
  if (req.method === 'GET' && req.query.mode === 'approved') {
    const snap = await adminDb
      .collection('conversations')
      .where(`approved.${uid}`, '==', true)
      .get();
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json(convs);
  }

  // PATCH approve
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

  // 5) Fallback
  res.setHeader('Allow', ['GET','POST','PATCH']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
