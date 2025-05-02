Thought for a couple of seconds


# WhisperChatv2

**Author:** David Sampson

A privacy‑focused, end‑to‑end encrypted chat application built with Next.js (App Router), Firebase Auth, Firestore, and OpenPGP.js. Users generate PGP keypairs in the browser, share only public keys to a Firestore collection, and exchange encrypted messages via Firestore. All decryption happens client‑side; private keys never leave the browser.

---

## Features

* **Email/Password Authentication** via Firebase Auth
* **PGP Key Generation** in‑browser on signup (RSA‑2048 or ECC, passphrase‑protected)
* **Public Key Directory** stored in Firestore (`publicKeys/{uid}`)
* **User Lookup** by secure Firebase UID (`/search`)
* **Conversation Requests** with “Approve” workflow
* **End‑to‑End Encryption** for all messages using OpenPGP.js
* **Self‑Decryption**: own messages are encrypted to both participants’ keys
* **Key Rotation** via `/keygen`
* **Secure Firestore Rules** ensuring only participants read/write

---

## Tech Stack

* **Frontend:** Next.js 15+ (App Router), React Hooks, Tailwind CSS
* **Backend/API:** Next.js API Routes with Firebase Admin SDK
* **Auth & Database:** Firebase Auth + Firestore
* **Crypto:** OpenPGP.js for key generation, encryption, decryption
* **State Management:** React Context for private key

---

## Project Structure

```
.
├── src
│   ├── app
│   │   ├── page.tsx            # Home / Landing page
│   │   ├── signup
│   │   │   └── page.tsx        # Signup + PGP key generation
│   │   ├── login
│   │   │   └── page.tsx        # Login page
│   │   ├── dashboard
│   │   │   └── page.tsx        # Pending & approved chats + UID display + key unlock prompt
│   │   ├── search
│   │   │   └── page.tsx        # Start chat by UID
│   │   ├── keygen
│   │   │   └── page.tsx        # Rotate / generate new PGP keys
│   │   └── chat
│   │       └── [convId]
│   │           └── page.tsx    # Chat room UI with real‑time encrypted messaging
│   ├── components
│   │   ├── Header.tsx          # Site header / nav
│   │   └── Footer.tsx          # Footer
│   ├── contexts
│   │   └── PrivateKeyContext.tsx  # React Context for in‑memory private key
│   ├── lib
│   │   ├── firebase.ts         # Firebase client SDK init
│   │   └── firebaseAdmin.ts    # Firebase Admin SDK init
│   └── styles
│       └── globals.css
├── src/pages
│   └── api
│       └── conversations.ts    # Protected API for listing, approving, creating chats
├── firestore.rules             # Firestore security rules
├── .env.local                  # Client env (NEXT_PUBLIC_FIREBASE_*)
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Installation & Setup

### Prerequisites

* **Node.js** ≥ 18
* **Firebase CLI** (`npm install -g firebase-tools`)
* A **Firebase Project** with Auth & Firestore enabled

### 1. Clone & Install

```bash
git clone https://github.com/your‑org/WhisperChatv2.git
cd WhisperChatv2
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…
```

### 3. Initialize Firebase

```bash
firebase login
firebase init firestore    # select your project, then choose to deploy rules
```

Make sure your `firestore.rules` matches:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /publicKeys/{userId} {
      allow read;
      allow write: if request.auth.uid == userId;
    }
    match /conversations/{convId} {
      allow create: if request.auth.uid in request.resource.data.participants;
      allow get: if request.auth.uid in resource.data.participants
                 && resource.data.approved[request.auth.uid] == true;
      allow update: if request.auth.uid in resource.data.participants;
      match /messages/{msgId} {
        allow list, get: if request.auth.uid in 
          get(/databases/$(database)/documents/conversations/$(convId)).data.participants
          && get(/databases/$(database)/documents/conversations/$(convId)).data
             .approved[request.auth.uid] == true;
        allow create: if request.auth.uid in 
          get(/databases/$(database)/documents/conversations/$(convId)).data.participants
          && get(/databases/$(database)/documents/conversations/$(convId)).data
             .approved[request.auth.uid] == true;
      }
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. **Sign Up** with email/password → you’ll be prompted to enter a PGP passphrase and then shown your new keypair.
2. **Save** your public & private keys securely (private key is also kept encrypted in `localStorage`).
3. **Dashboard** displays your UID (share this with friends), pending requests, and approved chats.
4. **Search** by friend’s UID → “Start Chat” → creates or reuses a conversation and navigates you into it.
5. **Approve** incoming requests on your Dashboard.
6. **Chat** in real‑time—messages are end‑to‑end encrypted and decrypted in the browser only.
7. **Key Rotation** via the “Key Gen” page: generate a new keypair, overwrite your public key in Firestore, and update your private key.

---

## Deployment

This app is optimized for Vercel:

1. Push your repo to GitHub.
2. In Vercel, import the project, set your environment variables, and deploy.
3. Vercel will run `npm run build` and serve with Vercel’s serverless functions.

---

## Security Notes

* **Passphrase‑protected keys:** Private keys are always stored encrypted in `localStorage` and only decrypted in memory.
* **Zero‑knowledge:** The server (Firestore) sees only encrypted messages and public keys.
* **Strong randomness:** Keys are generated using `window.crypto.getRandomValues`.
* **Rotate keys** at any time via `/keygen`.

---

## License

MIT © David Sampson
