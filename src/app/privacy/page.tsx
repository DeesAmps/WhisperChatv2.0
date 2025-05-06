// app/privacy/page.tsx
import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <main className="prose mx-auto p-6">
      <h1>Privacy Policy</h1>
        <br />
      <p>Last updated: May 4, 2025</p>

      <br />
      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account Data:</strong> Email address (used for authentication).</li>
        <li><strong>Conversation Data:</strong> Fully end‑to‑end encrypted; metadata stored in Toronto.</li>
        <li><strong>Profile Images:</strong> Stored in US Central, served via our CDN.</li>
        <li><strong>Analytics:</strong> Basic, anonymized logs (e.g. feature usage, timestamps).</li>
      </ul>
      <br />
      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To provide and maintain the Service.</li>
        <li>To authenticate you via Firebase Auth.</li>
        <li>To store and retrieve messages and profiles in Firestore.</li>
        <li>To detect abuse and improve performance through anonymized logs.</li>
      </ul>
      <br />
      <h2>3. Data Location &amp; Hosting</h2>
      <ul>
        <li>User details &amp; encrypted conversations: <strong>Toronto, Canada</strong>.</li>
        <li>Profile images: <strong>US Central</strong>.</li>
        <li>Hosting &amp; CDN: Vercel + Cloudflare (WAF/proxy).</li>
      </ul>
      <br />
      <h2>4. Data Sharing &amp; Disclosure</h2>
      <ul>
        <li>We do <strong>not</strong> sell or rent your personal data.</li>
        <li>We may disclose information to comply with legal obligations if provided with a legal warrant. However we have no way to decrypt your conversations.</li>
      </ul>
      <br />
      <h2>5. Third‑Party Services</h2>
      <ul>
        <li>Firebase Auth &amp; Firestore (Google)</li>
        <li>Vercel (hosting)</li>
        <li>Cloudflare (WAF, CDN)</li>
      </ul>
      <br />
      <h2>6. Security</h2>
      <p>
        We use industry‑standard security measures, including TLS in transit, strong encryption at rest, and Cloudflare WAF to protect against common threats. 
      </p>
      <br />
      <h2>7. Children’s Privacy</h2>
      <p>
        Our Service is not intended for users under 16. We do not knowingly collect data from children under 16.
      </p>
      <br />
      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We’ll post the revised date at the top and encourage you to review it periodically.
      </p>
      <br />
      <h2>9. Contact Us</h2>
      <p>
        If you have questions about this policy, please email <a href="mailto:privacy@whisperchat.io">privacy@whisperchat.io</a>
      </p>
    </main>
  );
}
