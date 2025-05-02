// src/lib/firebaseAdmin.ts
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app;
if (!getApps().length) {
  let serviceAccount: ServiceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Parse the env var and cast to ServiceAccount
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
  } else {
    // Load the JSON file at runtime in local dev
    const filePath = path.join(process.cwd(), 'firebase-service-account.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    serviceAccount = JSON.parse(raw) as ServiceAccount;
  }

  app = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb   = getFirestore(app);
