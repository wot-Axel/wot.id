# wot.id Core Design Principles

_Last updated: April 24, 2025_

## 1. Strict Decentralization
- No central authority or single point of failure.
- System must be strictly peer-to-peer, with all digital information stored in decentralized locations.
- All identity and data associations are anchored to an Ethereum account, verified by the Ethereum Attestation Service (EAS).

## 2. Verifiability & Security
- All actions and data must be provable on-chain.
- Ethereum mainnet is the canonical anchor for identity and critical attestations.
- No critical or persistent data is ever stored in browser localStorage.

## 3. EVM L2s for Scalability
- Use EVM-compatible Layer 2s (L2s) for scalable, low-cost user operations, but always with a canonical mainnet anchor.
- For the foreseeable future, Optimism is the ONLY L2 used for wot.id operations. No other L2s will be integrated unless this principle is explicitly revisited.

## 4. Multi-Chain Flexibility (Future-Proofing)
- The architecture is designed to be multi-chain ready, but mainnet remains the root of trust.
- Alt-L1s and app-specific chains are excluded unless explicitly reconsidered.

## 5. User Experience & Scalability
- Fast, low-cost transactions via L2s, with a scalable and modular architecture.
- All user data flows through centralized context/hooks or decentralized storage logic (e.g., Helia/IPFS), never through legacy browser storage patterns.

## 6. Security Preferences
- Emphasis on not using localStorage for sensitive data to enhance security.
- All data handling complies with decentralized principles.

## 7. Peer-to-Peer by Default
- All operations support multi-chain, but always with Ethereum mainnet as the root of trust.
- No single point of control or centralization in any system component.

---

These principles are permanent and must be strictly followed in all wot.id development and architectural decisions. They are published here for transparency and as a reference for all contributors.
