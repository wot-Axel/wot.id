import { EncryptionScheme, EncryptionPublicKeys, EncryptionPrivateKeys, EncryptedPayload } from './types';

import nacl from 'tweetnacl';
import sodium from 'libsodium-wrappers';

export const AES_X25519_SCHEME: EncryptionScheme = {
  name: 'aes-x25519',

  async encrypt(plaintext: Uint8Array, publicKeys: EncryptionPublicKeys): Promise<EncryptedPayload> {
    await sodium.ready;
    // 1. Generate a random symmetric key (32 bytes)
    const symKey = sodium.randombytes_buf(32);
    // 2. Encrypt plaintext with AES-GCM (12-byte IV)
    const aesIv = sodium.randombytes_buf(12); // 96-bit nonce for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      symKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: aesIv },
        cryptoKey,
        plaintext
      )
    );
    // 3. Encrypt the symmetric key with recipient's X25519 public key (24-byte nonce)
    if (!publicKeys.x25519Pub) throw new Error('Missing recipient X25519 public key');
    const ephemeral = sodium.crypto_box_keypair();
    const boxNonce = sodium.randombytes_buf(24); // 24-byte nonce for crypto_box_easy
    const wrappedKey = sodium.crypto_box_easy(symKey, boxNonce, publicKeys.x25519Pub, ephemeral.privateKey);
    // 4. Return EncryptedPayload
    return {
      ciphertext,
      wrappedKeys: { x25519: wrappedKey },
      meta: {
        algorithms: ['aes-gcm', 'x25519'],
        createdAt: new Date().toISOString(),
        aesIv: Buffer.from(aesIv).toString('base64'),
        boxNonce: Buffer.from(boxNonce).toString('base64'),
        ephemeralPub: Buffer.from(ephemeral.publicKey).toString('base64'),
      },
    };
  },

  async decrypt(payload: EncryptedPayload, privateKeys: EncryptionPrivateKeys): Promise<Uint8Array> {
    await sodium.ready;
    if (!privateKeys.x25519Priv) throw new Error('Missing X25519 private key');
    const aesIv = Buffer.from(payload.meta.aesIv, 'base64');
    const boxNonce = Buffer.from(payload.meta.boxNonce, 'base64');
    const ephemeralPub = Buffer.from(payload.meta.ephemeralPub, 'base64');
    // 1. Decrypt the symmetric key (X25519)
    const symKey = sodium.crypto_box_open_easy(
      payload.wrappedKeys.x25519!,
      boxNonce,
      ephemeralPub,
      privateKeys.x25519Priv
    );
    // 2. Decrypt the ciphertext with AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      symKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const plaintext = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: aesIv },
        cryptoKey,
        payload.ciphertext
      )
    );
    return plaintext;
  },
};
