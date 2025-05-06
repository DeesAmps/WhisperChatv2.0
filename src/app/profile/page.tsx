'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  onAuthStateChanged,
  updateEmail as fbUpdateEmail,
  updatePassword as fbUpdatePassword,
  updateProfile as fbUpdateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  const authClient = getAuth();

  const [user, setUser] = useState(authClient.currentUser);
  const [loading, setLoading] = useState(true);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [newEmail, setNewEmail]       = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [photoURL, setPhotoURL]       = useState('');
  const [imageFile, setImageFile]     = useState<File|null>(null);

  const [status, setStatus]           = useState<string|null>(null);

  // 1) Load user & public‐profile from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(authClient, async u => {
      if (!u) {
        router.replace('/login');
        return;
      }

      setUser(u);
      setEmail(u.email || '');
      // seed from Auth profile
      setDisplayName(u.displayName || '');
      setPhotoURL(u.photoURL || '');

      try {
        // fetch the publicKeys doc for name/avatar
        const pkSnap = await getDoc(doc(db, 'publicKeys', u.uid));
        if (pkSnap.exists()) {
          const data = pkSnap.data();
          if (data.displayName) setDisplayName(data.displayName);
          if (data.photoURL)    setPhotoURL(data.photoURL);
        }
      } catch (err: unknown) {
        console.error('Failed to read publicKeys doc', err);
      }

      setLoading(false);
    });

    return unsub;
  }, [router, authClient]);

  // 2) Save Display Name & photoURL
  async function handleSaveProfile() {
    if (!user) return;
    setStatus('Saving profile…');

    try {
      let finalPhotoURL = photoURL;
      if (imageFile) {
        const storage = getStorage();
        const imgRef = storageRef(storage, `profileImages/${user.uid}`);
        await uploadBytes(imgRef, imageFile, { contentType: 'image/png' });
        finalPhotoURL = await getDownloadURL(imgRef);
      }

      // 1) Update Auth profile
      await fbUpdateProfile(user, { displayName, photoURL: finalPhotoURL });

      // 2) Only keep email in /users (per new rules)
      await setDoc(
        doc(db, 'users', user.uid),
        { email: user.email },
        { merge: true }
      );

      // 3) Mirror public info into /publicKeys
      await setDoc(
        doc(db, 'publicKeys', user.uid),
        { displayName, photoURL: finalPhotoURL },
        { merge: true }
      );

      setPhotoURL(finalPhotoURL);
      setImageFile(null);
      setStatus('Profile updated');
    } catch (err: unknown) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : 'Error updating profile');
    }
  }

  // 3) Change email (unchanged)
  async function handleChangeEmail() {
    if (!user) return;
    setStatus('Updating email…');
    try {
      const cred = EmailAuthProvider.credential(user.email!, currentPass);
      await reauthenticateWithCredential(user, cred);

      await fbUpdateEmail(user, newEmail);
      // still okay to only write email
      await setDoc(
        doc(db, 'users', user.uid),
        { email: newEmail },
        { merge: true }
      );

      setEmail(newEmail);
      setNewEmail('');
      setCurrentPass('');
      setStatus('Email updated');
    } catch (err: unknown) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : 'Error updating email');
    }
  }

  // 4) Change password (unchanged)
  async function handleChangePassword() {
    if (!user) return;
    setStatus('Updating password…');
    try {
      const cred = EmailAuthProvider.credential(user.email!, currentPass);
      await reauthenticateWithCredential(user, cred);

      await fbUpdatePassword(user, newPass);

      setNewPass('');
      setCurrentPass('');
      setStatus('Password updated');
    } catch (err: unknown) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : 'Error updating password');
    }
  }

  // 5) Send password reset email (unchanged)
  async function handleSendReset() {
    if (!email) return;
    setStatus('Sending password reset email…');
    try {
      await sendPasswordResetEmail(authClient, email);
      setStatus('Password reset email sent');
    } catch (err: unknown) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : 'Error sending reset email');
    }
  }

  // 6) Copy UID
  const copyUid = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    alert('UID copied to clipboard!');
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-mono)]">
      {user && (
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
          <h2 className="text-lg font-medium mb-2">Your UID</h2>
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 font-mono text-sm text-gray-900 dark:text-gray-100">
            <span className="truncate">{user.uid}</span>
            <button
              onClick={copyUid}
              className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Copy
            </button>
          </div>
        </section>
      )}
      
      <h1 className="text-2xl font-semibold">Account Settings</h1>
      {status && <p className="text-sm text-blue-700 dark:text-blue-300">{status}</p>}

      {/* Profile */}
      <section className="space-y-2">
        <h2 className="font-medium">Profile</h2>
        <div className="flex items-center space-x-4">
            <Image
            src={photoURL}
            alt="Profile image"
            width={96}
            height={96}
            className="rounded-full object-cover"
          /> 
           <label className="block mb-4">
            <span className="font-medium">Profile Image</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Must be a PNG file, under 500KB.
            </p>
          <input
            type="file"
            accept="image/png"
            className ="mt-2"
            onChange={e =>{
              const file = e.target.files?.[0] ?? null;
              if (!file) {
                setImageFile(null);
                return;
              }
              //1) must be png
              if (file.type !== 'image/png') {
                setStatus('Only PNG images are allowed');
                return;
              }
              //2) must be under 500kb
              const MAX_BYTES = 500 * 1024;
              if (file.size > MAX_BYTES) {
                setStatus('Image must be under 500kb');
                return;
              }

              setStatus(null);
              setImageFile(file);
            }}
          />
          </label>
        </div>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Display Name"
        />
        <button
          onClick={handleSaveProfile}
          className="px-4 py-2 bg-foreground text-background rounded hover:bg-[#383838] transition-colors"
        >
          Save Profile
        </button>
      </section>

      {/* Email */}
      <section className="space-y-2">
        <h2 className="font-medium">Email</h2>
        <p className="text-sm">Current: {email}</p>
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="New email address"
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={currentPass}
          onChange={e => setCurrentPass(e.target.value)}
          placeholder="Current password"
        />
        <button
          onClick={handleChangeEmail}
          className="px-4 py-2 bg-foreground text-background rounded hover:bg-[#383838] transition-colors"
        >
          Update Email
        </button>
      </section>

      {/* Password */}
      <section className="space-y-2">
        <h2 className="font-medium">Password</h2>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
          placeholder="New password"
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={currentPass}
          onChange={e => setCurrentPass(e.target.value)}
          placeholder="Current password"
        />
        <button
          onClick={handleChangePassword}
          className="px-4 py-2 bg-foreground text-background rounded hover:bg-[#383838] transition-colors"
        >
          Change Password
        </button>
        <button
          onClick={handleSendReset}
          className="mt-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm"
        >
          Send Password Reset Email
        </button>
      </section>
    </div>
  );
}
