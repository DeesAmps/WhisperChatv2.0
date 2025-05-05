'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('privateKey');
    localStorage.removeItem('privateKeyArmored');
    window.location.href = '/login';
  };

  const links = [
    !user
      ? { href: '/login', label: 'Log In', onClick: undefined }
      : { href: '#', label: 'Log Out', onClick: handleLogout },
    !user && { href: '/signup', label: 'Sign Up' },
    { href: '/profile', label: 'Profile' },
    { href: '/friends', label: 'Friends' },
    { href: '/search', label: 'Search' },
    { href: '/keygen', label: 'Key Gen' },
    { href: '/dashboard', label: 'Dashboard' },
  ].filter(Boolean) as { href: string; label: string; onClick?: () => void }[];

  return (
    <header className="w-full container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
      {/* Logo */}
      <Link href="/">
        <Image src="/logo.png" alt="WhisperChat Logo" width={40} height={40} priority />
      </Link>

      {/* Hamburger */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(open => !open)}
          className="flex flex-col justify-between w-6 h-5 focus:outline-none"
          aria-label="Toggle menu"
        >
          <span className="block h-0.5 bg-current" />
          <span className="block h-0.5 bg-current" />
          <span className="block h-0.5 bg-current" />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-black border border-gray-200 rounded shadow-lg z-50">
            <ul className="flex flex-col">
              {links.map(({ href, label, onClick }) => (
                <li key={label} className="border-b last:border-b-0">
                  {onClick ? (
                    <button
                      onClick={() => { onClick(); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-purple-800"
                    >
                      {label}
                    </button>
                  ) : (
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-purple-800"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
