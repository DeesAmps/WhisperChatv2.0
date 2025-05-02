'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function Header() {
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
        <Link href="/signup" className="hover:underline">Sign Up</Link>
        <Link href="/search" className="hover:underline">Start Chat</Link>
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
      </nav>
    </header>
);
}
