import { EncryptionScheme, EncryptionPublicKeys, EncryptionPrivateKeys, EncryptedPayload } from './types';
import sodium from 'libsodium-wrappers';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';

// Hybrid encryption: encrypts with both classical and PQC schemes
export const HYBRID_SCHEME: EncryptionScheme = {
  name: 'hybrid',

  async encrypt(plaintext: Uint8Array, publicKeys: EncryptionPublicKeys): Promise<EncryptedPayload> {
    await sodium.ready;
    // 1. Generate a single symmetric key and IV
    const symKey = sodium.randombytes_buf(32);
    const aesIv = sodium.randombytes_buf(12);

    // 2. Encrypt plaintext with AES-GCM (once)
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

    // 3. Classical wrap: X25519
    if (!publicKeys.x25519Pub) throw new Error('Missing recipient X25519 public key');
    const ephemeral = sodium.crypto_box_keypair();
    const boxNonce = sodium.randombytes_buf(24);
    const wrappedKey_x25519 = sodium.crypto_box_easy(symKey, boxNonce, publicKeys.x25519Pub, ephemeral.privateKey);

    // 4. PQC wrap: Kyber
    if (!publicKeys.kyberPub) throw new Error('Missing recipient Kyber public key');
    // Use ML-KEM encapsulation to get a shared secret, then XOR with symKey for wrapping
    // Instead, we use the shared secret to encrypt symKey with AES-GCM (or just store symKey encrypted by Kyber)
    // But Kyber is a KEM, so we can use the encapsulation as a key encryption mechanism
    const { cipherText: kyberCipher, sharedSecret: kyberShared } = ml_kem768.encapsulate(publicKeys.kyberPub);
    // Encrypt symKey with Kyber shared secret using AES-GCM
    const kyberWrapIv = sodium.randombytes_buf(12);
    const kyberCryptoKey = await crypto.subtle.importKey(
      'raw',
      kyberShared,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    const wrappedKey_kyber = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: kyberWrapIv },
        kyberCryptoKey,
        symKey
      )
    );

    return {
      ciphertext,
      wrappedKeys: {
        x25519: wrappedKey_x25519,
        kyber: wrappedKey_kyber,
        kyberCipher: kyberCipher // needed for decapsulation
      },
      meta: {
        algorithms: ['aes-gcm', 'x25519', 'kyber'],
        createdAt: new Date().toISOString(),
        hybrid: true,
        aesIv: Buffer.from(aesIv).toString('base64'),
        boxNonce: Buffer.from(boxNonce).toString('base64'),
        ephemeralPub: Buffer.from(ephemeral.publicKey).toString('base64'),
        kyberWrapIv: Buffer.from(kyberWrapIv).toString('base64'),
      },
    };
  },

  async decrypt(payload: EncryptedPayload, privateKeys: EncryptionPrivateKeys): Promise<Uint8Array> {
    await sodium.ready;
    // Try classical decryption first
    try {
      // Classical unwrap
      if (!privateKeys.x25519Priv) throw new Error('Missing X25519 private key');
      const aesIv = Buffer.from(payload.meta.aesIv, 'base64');
      const boxNonce = Buffer.from(payload.meta.boxNonce, 'base64');
      const ephemeralPub = Buffer.from(payload.meta.ephemeralPub, 'base64');
      const symKey = sodium.crypto_box_open_easy(
        payload.wrappedKeys.x25519!,
        boxNonce,
        ephemeralPub,
        privateKeys.x25519Priv
      );
      // Decrypt ciphertext
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
    } catch (e) {
      // PQC unwrap
      if (!privateKeys.kyberPriv) throw new Error('Missing Kyber private key');
      const aesIv = Buffer.from(payload.meta.aesIv, 'base64');
      const kyberWrapIv = Buffer.from(payload.meta.kyberWrapIv, 'base64');
      // Decapsulate to get shared secret
      const kyberShared = ml_kem768.decapsulate(payload.wrappedKeys.kyberCipher!, privateKeys.kyberPriv);
      // Decrypt symKey
      const kyberCryptoKey = await crypto.subtle.importKey(
        'raw',
        kyberShared,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      const symKey = new Uint8Array(
        await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: kyberWrapIv },
          kyberCryptoKey,
          payload.wrappedKeys.kyber!
        )
      );
      // Decrypt ciphertext
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
    }
  },
};
