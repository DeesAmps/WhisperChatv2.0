'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="
      w-full
      container mx-auto px-4 sm:px-6 lg:px-8
      text-center text-xs text-gray-500 dark:text-gray-400
      font-[family-name:var(--font-geist-mono)]
      py-4
    ">
      © {new Date().getFullYear()} WhisperChat. All rights reserved.
      <br />
      <Link
        href="/terms"
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-1"
      >
        Terms of Service
      </Link>
      |
      <Link
        href="/privacy"
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-1"
      >
        Privacy Policy
      </Link>
      <div className="flex items-center justify-center mt-2">
        <img src="/logo.png" alt="WhisperChat Logo" width={40} height={40} />
      </div>
    </footer>
  );
}
