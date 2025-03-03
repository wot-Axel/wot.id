import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
  
export const EASContractAddress = "0xfda16985b01f97d81468a76dee939af365d518910ed2ebf06400290aff490fcf"; // Sepolia v0.26
  
  // Initialize the sdk with the address of the EAS Schema contract address
const eas = new EAS(EASContractAddress);
  
  // Gets a default provider (in production use something else like infura/alchemy)
const provider = ethers.getDefaultProvider("optimism");
  
  // Connects an ethers style provider/signingProvider to perform read/write functions.
  // MUST be a signer to do write operations!
eas.connect(provider);

export default function Page() {
    return (
      <div>
        <h1>EAS</h1>
        <p>
          uid: {eas.uid}
          schema: {eas.schema}
          This is an example page. You can find the source code for this page in <code>src/app/eas/page.tsx</code>.
        </p>
      </div>
    )
  
  }
  