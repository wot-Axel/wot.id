'use client';

import { Footer } from "@/components/Footer";
import { ConnectButton } from "@/components/ConnectButton";
import AttestationForm from '@/components/AttestationForm';

const AttestationPage = () => {
  return (
    <div className="pages">
      <h1>Ethereum Attestation Service</h1>
      <p>Create your attestation on the Optimism blockchain</p>
      
      <ConnectButton />
      
      <div className="attestation-container">
        <AttestationForm />
      </div>
      
      <div className="advice">
        <p>
          This attestation uses schema: <code>0xfda16985b01f97d81468a76dee939af365d518910ed2ebf06400290aff490fcf</code>
        </p>
        <p>
          <b>Caution:</b> This is an experimental feature. Attestations are permanent on the blockchain.
        </p>
      </div>
      
      <Footer />
    </div>
  );
};

export default AttestationPage;
