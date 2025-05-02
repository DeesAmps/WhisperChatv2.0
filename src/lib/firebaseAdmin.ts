// src/lib/firebaseAdmin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app;
if (!getApps().length) {
  // In production (Vercel), parse the JSON env var:
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('../../firebase-service-account.json');

  app = initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb   = getFirestore(app);
