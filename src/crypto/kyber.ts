import { EncryptionScheme, EncryptionPublicKeys, EncryptionPrivateKeys, EncryptedPayload } from './types';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { randomBytes } from '@noble/post-quantum/utils';

export const KYBER_SCHEME: EncryptionScheme = {
  name: 'kyber',

  async encrypt(plaintext: Uint8Array, publicKeys: EncryptionPublicKeys): Promise<EncryptedPayload> {
    // 1. Generate ephemeral Kyber keypair for sender (optional, not needed for KEM)
    // 2. Encapsulate to recipient's Kyber public key to get shared secret and ciphertext
    if (!publicKeys.kyberPub) throw new Error('Missing recipient Kyber public key');
    const { cipherText, sharedSecret } = ml_kem768.encapsulate(publicKeys.kyberPub);
    // 3. Use sharedSecret as symmetric key for AES-GCM
    const iv = randomBytes(12);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        plaintext
      )
    );
    // 4. Return EncryptedPayload
    return {
      ciphertext,
      wrappedKeys: { kyber: cipherText },
      meta: {
        algorithms: ['aes-gcm', 'kyber'],
        createdAt: new Date().toISOString(),
        aesIv: Buffer.from(iv).toString('base64'),
      },
    };
  },

  async decrypt(payload: EncryptedPayload, privateKeys: EncryptionPrivateKeys): Promise<Uint8Array> {
    if (!privateKeys.kyberPriv) throw new Error('Missing Kyber private key');
    const aesIv = Buffer.from(payload.meta.aesIv, 'base64');
    // 1. Decapsulate to get shared secret
    const sharedSecret = ml_kem768.decapsulate(payload.wrappedKeys.kyber!, privateKeys.kyberPriv);
    // 2. Decrypt the ciphertext with AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
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
