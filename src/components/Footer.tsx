import React from 'react';

export default function Footer() {
  return (
    <footer className="
      row-start-3
      w-full max-w-lg
      text-center text-xs text-gray-500 dark:text-gray-400
      font-[family-name:var(--font-geist-mono)]
    ">
      © {new Date().getFullYear()} WhisperChat. All rights reserved.
    </footer>
  );
}
