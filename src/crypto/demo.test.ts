// Demo/test script for crypto-agile module
import { CryptoAgile } from './index';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import sodium from 'libsodium-wrappers';

async function runDemo() {
  await sodium.ready;

  // --- Key Generation ---
  // Classical (X25519)
  const x25519Keypair = sodium.crypto_box_keypair();
  // PQC (Kyber ML-KEM-768)
  const kyberKeypair = ml_kem768.keygen();

  // --- Plaintext ---
  const plaintext = new TextEncoder().encode('Hello, quantum world!');

  // --- Hybrid Encryption ---
  const encrypted = await CryptoAgile.encrypt({
    plaintext,
    publicKeys: {
      x25519Pub: x25519Keypair.publicKey,
      kyberPub: kyberKeypair.publicKey,
    },
    scheme: 'hybrid',
  });
  console.log('Encrypted payload:', encrypted);

  // --- Hybrid Decryption ---
  const decrypted = await CryptoAgile.decrypt({
    payload: encrypted,
    privateKeys: {
      x25519Priv: x25519Keypair.privateKey,
      kyberPriv: kyberKeypair.secretKey,
    },
    scheme: 'hybrid',
  });
  console.log('Decrypted text:', new TextDecoder().decode(decrypted));

  // --- Metadata ---
  console.log('Encryption metadata:', encrypted.meta);
}

runDemo().catch(console.error);
