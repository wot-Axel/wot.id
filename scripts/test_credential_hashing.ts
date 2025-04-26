import { normalizeCredential, hashCredential, deriveEthereumAddress } from '../src/utils/credentialUtils';


// Test cases
const testCases = [
  { type: 'password', value: 'alice@example.com' },
  { type: 'password', value: 'ALICE@EXAMPLE.COM' }, // Should normalize to same as above
  { type: 'google', value: 'bob@gmail.com' },
  { type: 'apple', value: 'carol@icloud.com' },
  { type: 'password', value: 'dave@protonmail.com' },
];

console.log('Credential Hashing & Address Derivation Test Results:');
for (const { type, value } of testCases) {
  const normalized = normalizeCredential(type, value);
  const hash = hashCredential(normalized);
  const address = deriveEthereumAddress(hash);
  console.log('---');
  console.log('Type:', type);
  console.log('Value:', value);
  console.log('Normalized:', normalized);
  console.log('Hash:', hash);
  console.log('Derived Address:', address);
}

// Determinism check: ensure same input always gives same output
const input = 'password:alice@example.com';
const hash1 = hashCredential(input);
const hash2 = hashCredential(input);
const addr1 = deriveEthereumAddress(hash1);
const addr2 = deriveEthereumAddress(hash2);
if (hash1 !== hash2 || addr1 !== addr2) {
  throw new Error('Determinism test failed: outputs differ for same input');
} else {
  console.log('\nDeterminism test passed: same input yields same hash and address.');
}
