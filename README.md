
# WhisperChatv2

**Author:** David Sampson  
**Version:** 2.2.0  
**Release Date:** 2025‑05‑06

---

## 📖 Overview

WhisperChatv2 is a privacy‑focused, end‑to‑end encrypted chat app built with Next.js (App Router), Firebase Auth & Firestore, and OpenPGP.js. All encryption/decryption happens client‑side—your private key never leaves your browser.

---

## 🚀 Features

- **Email/Password Authentication** (Firebase Auth)  
- **Bot Protection** with invisible Google reCAPTCHA v3 on signup  
- **In‑Browser PGP Key Generation** (RSA‑2048 or ECC, passphrase‑protected)  
- **Public Key Directory** stored in Firestore (`publicKeys/{uid}`)  
- **Search by UID** to start or request a new conversation  
- **Approve‑Before‑Chat Workflow** for incoming requests  
- **End‑to‑End Encryption** (OpenPGP.js) & **Self‑Decryption**  
- **Key Rotation** via `/keygen`  
- **Chat Hub** (`/chat`) for quick access to all approved conversations  
- **Global Key Unlock** in the footer on every page  
- **Next.js API Routes** for secure server‑side operations  
- **Strict Firebase Rules** (Firestore & Storage) protecting every document  

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15+, React Hooks, Tailwind CSS  
- **Backend/API:** Next.js API Routes + Firebase Admin SDK  
- **Auth & Data:** Firebase Auth + Firestore & Storage  
- **Crypto:** OpenPGP.js (key gen, encrypt, decrypt)  
- **Bot‑Protection:** Google reCAPTCHA v3  
- **State:** React Context for private key in memory  

---

## 📂 Project Structure

```

.
├── src
│   ├── app
│   │   ├── layout.tsx            # Root layout + reCAPTCHA script
│   │   ├── page.tsx              # Landing page
│   │   ├── signup/page.tsx       # Signup + PGP key gen + reCAPTCHA
│   │   ├── login/page.tsx        # Login
│   │   ├── dashboard/page.tsx    # UID display + approve requests
│   │   ├── search/page.tsx       # Start chat by UID
│   │   ├── keygen/page.tsx       # Key rotation
│   │   └── chat
│   │       ├── page.tsx          # Chat hub (all chats)
│   │       └── \[convId]/page.tsx # Individual chat room
│   ├── components
│   │   ├── Header.tsx            # Responsive nav + menu
│   │   └── Footer.tsx            # Footer + global unlock form
│   ├── contexts
│   │   └── PrivateKeyContext.tsx # In‑memory PGP private key
│   ├── lib
│   │   ├── firebase.ts           # Client SDK init
│   │   └── firebaseAdmin.ts      # Admin SDK init
│   └── styles
│       └── globals.css           # Tailwind + custom properties
├── src/pages/api
│   ├── conversations.ts          # Chat CRUD + approvals
│   └── verify-captcha.ts         # reCAPTCHA v3 token verification
├── firestore.rules               # Firestore document rules
├── storage.rules                 # Storage (profileImages) rules
├── .env.local                    # Env vars (firebase, reCAPTCHA)
├── next.config.js                # Next.js config (image domains, etc.)
├── tailwind.config.js            # Tailwind setup
└── package.json

````

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** ≥ 18  
- **Firebase CLI** (`npm install -g firebase-tools`)  
- A **Firebase Project** with Auth, Firestore & Storage enabled  

### 1. Clone & Install

```bash
git clone https://github.com/your‑org/WhisperChatv2.git
cd WhisperChatv2
npm install
````

### 2. Configure Environment

Copy `.env.local.example` → `.env.local` and fill in:

```dotenv
# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…

# reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=…
RECAPTCHA_SECRET_KEY=…
```

### 3. Firebase Initialization

```bash
firebase login
firebase init firestore storage
```

* Select your project
* Point Firestore rules to `firestore.rules`
* Point Storage rules to `storage.rules`

Deploy your rules:

```bash
firebase deploy --only firestore:rules,storage:rules
```

### 4. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 💡 Usage

1. **Sign Up** → email/password + PGP passphrase → invisible reCAPTCHA → account + keys created.
2. **Dashboard** → view your UID, approve or see pending chat requests.
3. **Search** → enter friend’s UID to start or request a new chat.
4. **Chat Hub** (`/chat`) → jump into any approved conversation.
5. **Chat Room** → real‑time encrypted messaging.
6. **Key Rotation** → generate & upload a new public key at `/keygen`.
7. **Global Unlock** → if your private key is in `localStorage`, unlock it from the footer.

---

## 🌐 Deployment

This project is optimized for Vercel:

1. Push your repo to GitHub.
2. In Vercel, import the repo, set environment variables (from `.env.local`).
3. Vercel runs `npm run build` and deploys automatically.

---

## 🔒 Security Notes

* **Invisible CAPTCHA**: prevents automated signups.
* **Client‑side key**: private keys never leave the browser.
* **Strict Firestore rules**: only owners and approved participants can read/write.
* **Storage rules**: profile images must be PNG ≤ 200 KB, owner‑only.
* **Zero‑knowledge**: Firestore stores only public keys & ciphertext.

---

## 📄 License

MIT © David Sampson

