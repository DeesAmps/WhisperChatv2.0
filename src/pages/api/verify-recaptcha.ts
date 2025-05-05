// src/pages/api/verify-captcha.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token, action } = req.body;
  const secret = process.env.RECAPTCHA_SECRET_KEY!;
  const r = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
    { method: 'POST' }
  );
  const data = await r.json();
  if (!data.success || data.action !== action || (data.score ?? 0) < 0.5) {
    return res.status(400).json({ success: false });
  }
  return res.status(200).json({ success: true });
}
