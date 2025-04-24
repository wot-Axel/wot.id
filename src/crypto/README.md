# wot.id Crypto-Agile Encryption Module

## Overview
This module implements crypto-agile, hybrid encryption for wot.id, supporting both classical (AES-GCM/X25519) and post-quantum (Kyber ML-KEM-768) cryptography. It is designed to be:
- **Future-proof:** Ready for post-quantum threats.
- **Decentralized:** No central authority or single point of failure.
- **Peer-to-peer:** All crypto is client-side.
- **Extensible:** Easy to add/upgrade algorithms.

## Architecture

### Hybrid Encryption Flow
1. **Symmetric Key and IV Generation:**
   - A random 32-byte symmetric key (`symKey`) and a 12-byte AES-GCM IV (`aesIv`) are generated once per encryption.
2. **Data Encryption:**
   - The plaintext is encrypted using AES-GCM with `symKey` and `aesIv`.
3. **Key Wrapping:**
   - **Classical (X25519):**
     - `symKey` is wrapped using X25519 (ECDH) with a random ephemeral key and a 24-byte nonce (`boxNonce`).
   - **Post-Quantum (Kyber):**
     - A Kyber encapsulation is performed to derive a shared secret.
     - `symKey` is encrypted with this shared secret using AES-GCM and a random 12-byte IV (`kyberWrapIv`).
     - The Kyber ciphertext (`kyberCipher`) is needed for decapsulation.
4. **Payload Construction:**
   - The encrypted payload contains:
     - `ciphertext`: The AES-GCM encrypted data.
     - `wrappedKeys`: `{ x25519, kyber, kyberCipher }`.
     - `meta`: All IVs, nonces, algorithm names, timestamps, and ephemeral public keys needed for decryption.

### Metadata & Versioning
- Every payload contains a `meta` object with:
  - `algorithms`: List of algorithms used.
  - `createdAt`: ISO timestamp.
  - `hybrid`: Boolean flag.
  - `aesIv`: IV for AES-GCM data encryption (base64).
  - `boxNonce`: Nonce for X25519 key wrapping (base64).
  - `ephemeralPub`: Ephemeral public key for X25519 (base64).
  - `kyberWrapIv`: IV for Kyber key wrapping (base64).
  - **Extensible:** Additional fields can be added for future algorithms or versioning.

### Key Management
- **X25519:** Use `libsodium-wrappers` for keypair generation.
- **Kyber:** Use `@noble/post-quantum` for keypair generation.
- **Key Rotation:** Not yet implemented, but the architecture supports easy re-wrapping of `symKey` with new keys.
- **Multi-Recipient:** Not yet implemented, but can be added by wrapping `symKey` for multiple recipients.

### Error Handling
- Throws clear errors if required keys are missing.
- Decryption attempts both classical and PQC paths; if both fail, an error is thrown.

### Extensibility
- New algorithms can be added by extending the `EncryptionScheme` interface and updating the hybrid logic.
- Metadata and key wrapping are designed to be forward-compatible.

## Usage

### Key Generation
```typescript
import sodium from 'libsodium-wrappers';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
await sodium.ready;
const x25519Keypair = sodium.crypto_box_keypair();
const kyberKeypair = ml_kem768.keygen();
```

### Encrypt Data (Hybrid)
```typescript
import { CryptoAgile } from './index';
const payload = await CryptoAgile.encrypt({
  plaintext: new TextEncoder().encode('secret'),
  publicKeys: {
    x25519Pub: x25519Keypair.publicKey,
    kyberPub: kyberKeypair.publicKey,
  },
  scheme: 'hybrid',
});
```

### Decrypt Data (Hybrid)
```typescript
const plaintext = await CryptoAgile.decrypt({
  payload,
  privateKeys: {
    x25519Priv: x25519Keypair.privateKey,
    kyberPriv: kyberKeypair.secretKey,
  },
  scheme: 'hybrid',
});
```

### Inspect Metadata
```typescript
console.log(payload.meta);
```

### Example Encrypted Payload Structure
```json
{
  "ciphertext": "...",
  "wrappedKeys": {
    "x25519": "...",
    "kyber": "...",
    "kyberCipher": "..."
  },
  "meta": {
    "algorithms": ["aes-gcm", "x25519", "kyber"],
    "createdAt": "2025-04-24T11:43:12.237Z",
    "hybrid": true,
    "aesIv": "base64...",
    "boxNonce": "base64...",
    "ephemeralPub": "base64...",
    "kyberWrapIv": "base64..."
  }
}
```

## Algorithms
- **Classical:** AES-GCM (symmetric), X25519 (key exchange)
- **PQC:** Kyber ML-KEM-768 (key encapsulation)
- **Hybrid:** Combines both for maximal security and crypto-agility

## Security Notes
- All cryptographic operations are client-side; no keys or plaintexts leave the user’s device.
- Hybrid encryption is the default and recommended mode for future-proofing.
- The module is designed for easy key rotation and algorithm upgrades.
- All nonces and IVs are randomly generated and unique per encryption.
- The Kyber ciphertext (`kyberCipher`) is required for PQC decryption and is always included in the payload.
- The module is compatible with decentralized storage (IPFS/Helia) and EAS attestations.

## Error Handling
- Errors are thrown for missing keys, malformed payloads, or decryption failures.
- Both classical and PQC decryption paths are attempted; if both fail, a descriptive error is thrown.

## Extending the Module
- To add a new algorithm, implement the `EncryptionScheme` interface and update the hybrid logic to wrap the symmetric key with the new scheme.
- To support multi-recipient encryption, wrap the symmetric key for each recipient and store all wrapped keys in the payload.
- All metadata fields are extensible; add versioning or additional algorithm identifiers as needed.

## For Security Auditors
- All cryptographic primitives are from audited, reputable libraries:
  - [libsodium-wrappers](https://www.npmjs.com/package/libsodium-wrappers) for X25519/AES-GCM
  - [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum) for Kyber ML-KEM
- The module uses best practices for nonce/IV generation and key separation.
- All encryption/decryption is performed in constant time by the underlying libraries.
- The design is crypto-agile and ready for PQC migration as standards evolve.

## References
- [libsodium-wrappers](https://www.npmjs.com/package/libsodium-wrappers)
- [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum)
- [NIST PQC Standardization](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [FIPS-203 (ML-KEM)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf)
