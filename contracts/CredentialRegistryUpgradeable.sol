// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title CredentialRegistryUpgradeable
 * @dev Upgradeable contract for mapping credentials to userIDs (Ethereum addresses) using OpenZeppelin's UUPS proxy pattern.
 * TimelockController is to be deployed separately and set as the owner for upgrade governance.
 */
contract CredentialRegistryUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    mapping(bytes32 => address) public credentialToUserID;
    mapping(address => uint256) public credentialCount;

    event CredentialLinked(bytes32 indexed credentialHash, address indexed userID);
    event CredentialUnlinked(bytes32 indexed credentialHash, address indexed userID);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function linkCredential(bytes32 credentialHash, address userID) external onlyOwner {
        require(credentialToUserID[credentialHash] == address(0), "Credential already linked");
        credentialToUserID[credentialHash] = userID;
        credentialCount[userID]++;
        emit CredentialLinked(credentialHash, userID);
    }

    function unlinkCredential(bytes32 credentialHash) external onlyOwner {
        address userID = credentialToUserID[credentialHash];
        require(userID != address(0), "Credential not linked");
        require(credentialCount[userID] > 1, "Cannot remove last credential");
        delete credentialToUserID[credentialHash];
        credentialCount[userID]--;
        emit CredentialUnlinked(credentialHash, userID);
    }

    function getUserID(bytes32 credentialHash) external view returns (address) {
        return credentialToUserID[credentialHash];
    }

    /// @dev UUPS upgrade authorization function
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
