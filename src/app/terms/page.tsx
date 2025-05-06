// app/terms/page.tsx
import React from 'react';

export default function TermsPage() {
  return (
    <main className="prose mx-auto p-6">
      <h1>Terms &amp; Conditions</h1>
        <br />

      <p>Last updated: May 4, 2025</p>
      <br />
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using WhisperChat (“the Service”), you agree to be bound by these Terms &amp; Conditions.
        If you do not agree, please do not use the Service.
      </p>
      <br />
      <h2>2. Use of the Service</h2>
      <ul>
        <li>The Service is provided free of charge.</li>
        <li>You agree not to use the Service for any illegal purpose or activity.</li>
        <li>All messages you send are your responsibility. WhisperChat is not liable for user‑generated content.</li>
      </ul>
      <br />
      <h2>3. Account Security</h2>
      <p>
        You are responsible for maintaining the security of your account credentials and any device you use to access the Service.
      </p>
      <br />
      <h2>4. Analytics &amp; Logs</h2>
      <p>
        We collect basic, anonymized analytics (e.g. page views, feature use) to improve the Service. No personally identifying information is retained in these logs.
      </p>
      <br />
      <h2>5. Modifications &amp; Termination</h2>
      <ul>
        <li>We may modify or discontinue the Service (or any part) at any time, with or without notice.</li>
        <li>We reserve the right to suspend or terminate accounts for violations of these terms.</li>
      </ul>
      <br />
      <h2>6. Disclaimers &amp; Limitations</h2>
      <p>
        The Service is provided “as is” and “as available” without warranties of any kind. We disclaim all liability for any loss or damage arising from your use of the Service.
      </p>
      <br />
      <h2>7. Governing Law</h2>
      <p>
        These terms are governed by the laws of Ontario, Canada, without regard to its conflict‑of‑law provisions.
      </p>
      <br />
      <h2>8. Contact Us</h2>
      <p>
        Questions or concerns? Please email us at <a href="mailto:privacy@whisperchat.io">privacy@whisperchat.io</a>
      </p>
    </main>
  );
}
