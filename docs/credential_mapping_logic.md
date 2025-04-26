# wot.id Credential-to-userID Mapping Logic

This document describes the robust, secure, and performant mapping logic for linking credentials to userIDs (Ethereum addresses) in wot.id.

---

## 1. Credential Normalization & Hashing
- Every credential is normalized and namespaced (e.g., `password:alice@example.com`).
- The normalized credential is hashed (SHA-256 or keccak256).
- Passwords are slow-hashed (e.g., Argon2) before namespacing and hashing for on-chain mapping.

## 2. On-Chain Mapping (Optimism L2)
- Mapping: `mapping(bytes32 => address) public credentialToUserID;`
- Each credential hash maps to a single deterministic Ethereum mainnet userID.
- Uniqueness is enforced: a credential can only be linked to one userID.

## 3. Linking a Credential
- On login or credential add, normalize and hash the credential.
- Query the contract:
  - If mapping exists: retrieve userID.
  - If not: deterministically generate userID, store mapping.
- Adding a new credential: only if not already linked to another userID.

## 4. Unlinking/Removing a Credential
- Only authenticated users can unlink.
- Cannot remove the last credential (prevents lockout).

## 5. Fetching All Credentials for a userID
- Aggregate contract events to reconstruct all credentials for a userID.
- No centralized DB; on-chain event log is the source of truth.

## 6. Security Measures
- Only hashed credentials are stored/mapped.
- Authentication is required for linking/unlinking.
- All changes are auditable on-chain.
- Rate limiting and anti-abuse logic can be implemented in the contract.

## 7. Performance
- All mapping operations are fast and low-cost on Optimism L2.
- UI aggregates events for efficient display.

## 8. Example Solidity Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CredentialRegistry {
    mapping(bytes32 => address) public credentialToUserID;
    mapping(address => uint256) public credentialCount;

    event CredentialLinked(bytes32 indexed credentialHash, address indexed userID);
    event CredentialUnlinked(bytes32 indexed credentialHash, address indexed userID);

    function linkCredential(bytes32 credentialHash, address userID) external {
        require(credentialToUserID[credentialHash] == address(0), "Credential already linked");
        credentialToUserID[credentialHash] = userID;
        credentialCount[userID]++;
        emit CredentialLinked(credentialHash, userID);
    }

    function unlinkCredential(bytes32 credentialHash) external {
        address userID = credentialToUserID[credentialHash];
        require(userID != address(0), "Credential not linked");
        // Add authentication check here (e.g., msg.sender == userID or delegated authority)
        require(credentialCount[userID] > 1, "Cannot remove last credential");
        delete credentialToUserID[credentialHash];
        credentialCount[userID]--;
        emit CredentialUnlinked(credentialHash, userID);
    }

    function getUserID(bytes32 credentialHash) external view returns (address) {
        return credentialToUserID[credentialHash];
    }
}
```

## 9. Summary Table
| Step                  | Logic/Operation                                                    |
|-----------------------|--------------------------------------------------------------------|
| Normalize & hash      | Namespaced credential → hash                                       |
| On-chain mapping      | `credentialHash` → `userID` (Ethereum address)                     |
| Add credential        | Only if not already linked; must authenticate as userID            |
| Remove credential     | Only by userID; cannot remove last credential                      |
| Fetch all credentials | Aggregate on-chain events for userID                               |
| Security              | No raw credentials, strong authentication, auditability            |

---

This mapping logic is the foundation for robust, secure, and performant account and credential management in wot.id.
