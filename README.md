# WhisperChatv2

**Author:** David Sampson

A privacy‑focused, end‑to‑end encrypted chat application built with Next.js (App Router), Firebase Auth, Firestore, and OpenPGP.js. Users generate PGP keypairs in the browser, share only public keys to a Firestore collection, and exchange encrypted messages via Firestore. All decryption happens client‑side; private keys never leave the browser.

---

## Features

* **Email/Password Authentication** via Firebase Auth
* **Bot Protection** with invisible Google reCAPTCHA v3 on signup
* **PGP Key Generation** in‑browser on signup (RSA‑2048 or ECC, passphrase‑protected)
* **Public Key Directory** stored in Firestore (`publicKeys/{uid}`)
* **User Lookup** by secure Firebase UID (`/search`)
* **Conversation Requests** with “Approve” workflow
* **End‑to‑End Encryption** for all messages using OpenPGP.js
* **Self‑Decryption**: own messages are encrypted to both participants’ keys
* **Key Rotation** via `/keygen`
* **Secure Firestore Rules** ensuring only participants read/write
* **Next.js API Routes** for server‑side operations (captcha verification, conversations)

---

## Tech Stack

* **Frontend:** Next.js 15+ (App Router), React Hooks, Tailwind CSS
* **Backend/API:** Next.js API Routes with Firebase Admin SDK
* **Auth & Database:** Firebase Auth + Firestore
* **Crypto:** OpenPGP.js for key generation, encryption, decryption
* **Bot‑Protection:** Google reCAPTCHA v3
* **State Management:** React Context for private key

---

## Project Structure

```
.
├── src
│   ├── app
│   │   ├── layout.tsx            # Root layout + reCAPTCHA v3 <Script>
│   │   ├── page.tsx              # Home / Landing page
│   │   ├── signup
│   │   │   └── page.tsx          # Signup + PGP key generation + reCAPTCHA
│   │   ├── login
│   │   │   └── page.tsx          # Login page
│   │   ├── dashboard
│   │   │   └── page.tsx          # Pending & approved chats + UID display
│   │   ├── search
│   │   │   └── page.tsx          # Start chat by UID
│   │   ├── keygen
│   │   │   └── page.tsx          # Rotate / generate new PGP keys
│   │   └── chat
│   │       └── [convId]
│   │           └── page.tsx      # Chat room UI with real‑time encrypted messaging
│   ├── components
│   │   ├── Header.tsx            # Site header / nav
│   │   └── Footer.tsx            # Footer
│   ├── contexts
│   │   └── PrivateKeyContext.tsx # React Context for in‑memory private key
│   ├── lib
│   │   ├── firebase.ts           # Firebase client SDK init + emulator hookup
│   │   └── firebaseAdmin.ts      # Firebase Admin SDK init
│   └── styles
│       └── globals.css
├── src/pages
│   └── api
│       ├── conversations.ts      # Protected API for listing, approving, creating chats
│       └── verify-captcha.ts     # Server‑side reCAPTCHA v3 token verification
├── firestore.rules               # Firestore security rules
├── .env.local                    # Client & server env (NEXT_PUBLIC_*, RECAPTCHA_SECRET_KEY, etc.)
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Installation & Setup

### Prerequisites

* **Node.js** ≥ 18
* **Firebase CLI** (`npm install -g firebase-tools`)
* A **Firebase Project** with Auth & Firestore enabled

### 1. Clone & Install

```bash
git clone https://github.com/your‑org/WhisperChatv2.git
cd WhisperChatv2
npm install
```

### 2. Configure Environment

Copy `.env.local.example` → `.env.local` and fill in your credentials:

```dotenv
# Firebase client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…

# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

### 3. Initialize Firebase

```bash
firebase login
firebase init firestore
```

Ensure your `firestore.rules` matches your security model (publicKeys, users, conversations, messages). Then deploy:

```bash
firebase deploy --only firestore:rules
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

1. **Sign Up** → fill email/password, PGP passphrase ⇒ Google reCAPTCHA v3 runs invisibly ⇒ account + keys created.
2. **Save** your public & private keys securely; private key is stored encrypted in `localStorage`.
3. **Dashboard** shows your UID, incoming requests, approved chats.
4. **Search** by friend’s UID → “Start Chat” ⇒ conversation created/requested.
5. **Approve** incoming requests on your Dashboard.
6. **Chat** in real‑time: messages encrypted client‑side, decrypted only in the browser.
7. **Key Rotation** via `/keygen`: generate a new keypair and overwrite publicKeys.

---

## Deployment

Optimized for Vercel:

1. Push to GitHub.
2. Import project in Vercel, set environment variables.
3. Vercel runs `npm run build` and deploys.

---
## Security Notes

* **Invisible CAPTCHA**: Google reCAPTCHA v3 tokens verified server‑side to block bots.
* **Passphrase‑protected keys**: Private keys are always encrypted at rest in the browser.
* **Zero‑knowledge**: Firestore stores only public keys and ciphertext.
* **Strong randomness**: Keys generated using `window.crypto`.
* **Strict rules**: Firestore security rules lock down reads/writes per user role.
---
## License

MIT © David Sampson
