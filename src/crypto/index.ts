// Main crypto-agile API for wot.id
import { AES_X25519_SCHEME } from './aes_x25519';
import { KYBER_SCHEME } from './kyber';
import { HYBRID_SCHEME } from './hybrid';
import { EncryptionScheme, EncryptionPublicKeys, EncryptionPrivateKeys, EncryptedPayload } from './types';

export const CryptoAgile = {
  schemes: {
    'aes-x25519': AES_X25519_SCHEME,
    'kyber': KYBER_SCHEME,
    'hybrid': HYBRID_SCHEME,
  },

  async encrypt({ plaintext, publicKeys, scheme = 'hybrid' }: {
    plaintext: Uint8Array,
    publicKeys: EncryptionPublicKeys,
    scheme?: 'aes-x25519' | 'kyber' | 'hybrid',
  }): Promise<EncryptedPayload> {
    return await this.schemes[scheme].encrypt(plaintext, publicKeys);
  },

  async decrypt({ payload, privateKeys, scheme = 'hybrid' }: {
    payload: EncryptedPayload,
    privateKeys: EncryptionPrivateKeys,
    scheme?: 'aes-x25519' | 'kyber' | 'hybrid',
  }): Promise<Uint8Array> {
    return await this.schemes[scheme].decrypt(payload, privateKeys);
  },
};
