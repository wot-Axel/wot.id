// Common interfaces and types for crypto-agile encryption module

export interface EncryptionPublicKeys {
  x25519Pub?: Uint8Array; // Classical
  kyberPub?: Uint8Array;  // PQC
  // Add additional PQC keys as needed
}

export interface EncryptionPrivateKeys {
  x25519Priv?: Uint8Array;
  kyberPriv?: Uint8Array;
}

export interface EncryptedPayload {
  ciphertext: Uint8Array;
  wrappedKeys: {
    [key: string]: Uint8Array | undefined;
  };
  meta: {
    algorithms: string[];
    createdAt: string;
    keyIds?: string[];
    [key: string]: any;
  };
}

export interface EncryptionScheme {
  name: string;
  encrypt(plaintext: Uint8Array, publicKeys: EncryptionPublicKeys): Promise<EncryptedPayload>;
  decrypt(payload: EncryptedPayload, privateKeys: EncryptionPrivateKeys): Promise<Uint8Array>;
}
