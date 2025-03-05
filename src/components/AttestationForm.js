// components/AttestationForm.js
import { EAS } from '@ethereum-attestation-service/eas-sdk';
//import { ethers } from 'ethers';
import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const EAS_CONTRACT_ADDRESS = '0x4200000000000000000000000000000000000021'; // Replace with actual EAS contract address on Optimism
const SCHEMA_ID = '0xfda16985b01f97d81468a76dee939af365d518910ed2ebf06400290aff490fcf'; // Replace with actual schema ID

const AttestationForm = () => {
  const [attestationData, setAttestationData] = useState('');
  const { address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleAttestation = async () => {
    if (!address) {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      const provider = new ethers.providers.JsonRpcProvider('https://mainnet.optimism.io');
      const eas = new EAS(EAS_CONTRACT_ADDRESS, provider);

      // Example attestation creation
      const attestationId = await eas.attest({
        schemaId: SCHEMA_ID,
        recipient: address,
        data: {
          // Example data fields based on schema
          wotid: '',
          ishuman: boolean,
        },
      });

      console.log('Attestation created:', attestationId);
    } catch (error) {
      console.error('Error creating attestation:', error);
    }
  };

  return (
    <div>
      <button onClick={handleAttestation}>Create Attestation</button>
      <button onClick={disconnect}>Disconnect Wallet</button>
      <button onClick={() => connect({ connector: new InjectedConnector() })}>
        Connect Wallet
      </button>
    </div>
  );
};

export default AttestationForm;
