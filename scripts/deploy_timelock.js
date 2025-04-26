// scripts/deploy_timelock.js
// Example Hardhat script to deploy TimelockController for wot.id upgrade governance

const { ethers } = require("hardhat");

async function main() {
    // Set up 3-out-of-5 multisig addresses (replace with real addresses)
    const proposers = [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222",
        "0x3333333333333333333333333333333333333333",
        "0x4444444444444444444444444444444444444444",
        "0x5555555555555555555555555555555555555555"
    ];
    const executors = proposers; // Allow all signers to execute
    const minDelay = 48 * 60 * 60; // 48 hours in seconds

    const TimelockController = await ethers.getContractFactory("TimelockController");
    const timelock = await TimelockController.deploy(minDelay, proposers, executors);
    await timelock.deployed();

    console.log("TimelockController deployed at:", timelock.address);
    console.log("Min delay:", minDelay, "seconds");
    console.log("Proposers:", proposers);
    console.log("Executors:", executors);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
