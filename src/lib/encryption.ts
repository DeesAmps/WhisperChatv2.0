import * as openpgp from 'openpgp';

/**
 * Encrypt `plaintext` for the holder of `recipientArmoredKey`. 
 * Optionally sign with your own `privateArmoredKey` + `passphrase`.
 */
export async function encryptPGP(
  plaintext: string,
  recipientArmoredKey: string,
  privateArmoredKey: string,
  passphrase: string
): Promise<string> {
  // parse the recipient's public key (auto‑detect RSA vs ECC)
  const publicKey = await openpgp.readKey({ armoredKey: recipientArmoredKey });

  // parse & decrypt *your* private key for signing
  const privKeyObj = await openpgp.readPrivateKey({ armoredKey: privateArmoredKey });
  const signingKey = await openpgp.decryptKey({ privateKey: privKeyObj, passphrase });

  // build the OpenPGP message
  const message = await openpgp.createMessage({ text: plaintext });

  // encrypt for recipient, sign with you
  return await openpgp.encrypt({
    message,
    encryptionKeys: publicKey,
    signingKeys: signingKey
  });
}

/**
 * Decrypt `ciphertext` with your private key + passphrase.
 */
export async function decryptPGP(
  ciphertext: string,
  privateArmoredKey: string,
  passphrase: string
): Promise<string> {
  const privKeyObj = await openpgp.readPrivateKey({ armoredKey: privateArmoredKey });
  const decryptionKey = await openpgp.decryptKey({ privateKey: privKeyObj, passphrase });
  const message = await openpgp.readMessage({ armoredMessage: ciphertext });

  const { data: decrypted } = await openpgp.decrypt({
    message,
    decryptionKeys: decryptionKey
  });
  return decrypted;
}
