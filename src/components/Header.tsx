'use client';

import Image from 'next/image';
import Link from 'next/link';
import React,  {useEffect} from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';


export default function Header() {

  const [user, setUser] = React.useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('privateKey');
    localStorage.removeItem('privateKeyArmored');
    window.location.href='/login';
  };

  return (
    <header className="
      row-start-1
      w-full max-w-lg
      flex items-center justify-between
    ">
      {/* Logo */}
      <Link href="/">
        <Image
          src="/logo.png"
          alt="WhisperChat Logo"
          width={40}
          height={40}
          priority
        />
      </Link>

      {/* Nav Links */}
      <nav className="flex space-x-4 text-sm font-[family-name:var(--font-geist-mono)]">
        
        {!user ? (
            <Link href="/login" className="hover:underline">Log In</Link>
        ) : (
            <button 
                onClick={handleLogout}
                className="hover:underline bg-transparent p-0"
            >
                Log Out
            </button>

        )}
        {!user && (
            <Link href="/signup" className="hover:underline">Sign Up</Link>
        )}

        <Link href="/search" className="hover:underline">Start Chat</Link>
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
      </nav>
    </header>
);
}
