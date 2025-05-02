import type { Metadata } from "next";
import "./globals.css";
import { PrivateKeyProvider } from '../contexts/PrivateKeyContext';
import React from "react";




export const metadata: Metadata = {
  title: "WhisperChat",
  description: "Encrypted Chat Application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivateKeyProvider>
          {children}
        </PrivateKeyProvider>
      </body>
    </html>
  );
}
