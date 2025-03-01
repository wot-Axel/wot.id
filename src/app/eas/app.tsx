import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { useState } from "react";
import { SCHEMA } from "./config";
import { useEAS } from "./useEAS";
import { Address } from "viem";

type AttestationData = {
  wotid: Address;
  ishuman: boolean;
};
/** @dev AFTER REGISTERING A SCHEMA, OR MAKING AN ATTESTATION
 * IF YOU REFRESH APP MAKE SURE TO PASTE IN SCHEMA/ATTESTATIONUID IN STATE VARIABLES OR ELSE APP WONT WORK
 * */
const App = () => {
  const { eas, currentAddress } = useEAS();
  console.log("currentAddress ", currentAddress);
  // schemaUID is set when Freelancer register's their own reputation schema
  const [schemaUID] = useState<string>(
    "0xfda16985b01f97d81468a76dee939af365d518910ed2ebf06400290aff490fcf"
  );
  const [attestationUID, setAttestationUID] = useState<string>(
    "0x4968c28d7e6a01c46c2bc1cfc5edb64a49e94801126c0c0a1d848ed72bd262c9"
  );
  const [attestationData, setAttestationData] = useState<AttestationData>({
    wotid: "0xBBfB973B887DD339eC01E3335be71415e0f1D41b",
    ishuman: false,
  });

  const handleAttestationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;

    setAttestationData({
      ...attestationData,
      [name]: type === "checkbox" ? checked : value,
    });
  };


  const createAttestation = async () => {
    if (!eas || !schemaUID) return;
    const schemaEncoder = new SchemaEncoder(SCHEMA);
    const encodedData = schemaEncoder.encodeData([
      { name: "hiwot", value: currentAddress, type: "string" },
      { name: "ishuman", value: attestationData.ishuman, type: "bool" },
    ]);

    const transaction = await eas.attest({
      schema: schemaUID,
      data: {
        recipient: attestationData.wotid,
        expirationTime: undefined,
        revocable: true, // Be aware that if your schema is not revocable, this MUST be false
        data: encodedData,
      },
    });

    const newAttestationUID = await transaction.wait();
    setAttestationUID(newAttestationUID);

    console.log("New attestation UID:", newAttestationUID);
    console.log("Creating Attestation:", attestationData);
  };

  const revokeAttestation = async () => {
    if (!eas) return;
    const attestation = await eas.getAttestation(attestationUID);

    const transaction = await eas.revoke({
      schema: attestation.schema,
      data: { uid: attestation.uid },
    });
    const receipt = await transaction.wait();
    console.log("Revoking Attestation:", receipt);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h1>Ethereum Attestation Service</h1>
      <h2 style={{ textAlign: "center" }}>
        {!schemaUID
          ? "Step 1: Freelancer registers a schema for their own reputation"
          : "Step 2: Client creates attestation for Freelancer`s credibility"}
      </h2>

      

      {schemaUID && (
        <>
          <h2>Create Attestation</h2>
          <input
            type="text"
            name="freelancer"
            value={attestationData.wotid}
            onChange={handleAttestationChange}
            placeholder="wotid"
          />
          
          <label htmlFor="ishuman">
            This address represents a human being
          </label>
          <input
            type="checkbox"
            id="ishuman"
            name="ishuman"
            checked={attestationData.ishuman}
            onChange={handleAttestationChange}
          />
          <button onClick={createAttestation}>Create Attestation</button>

          <h2>Revoke Attestation</h2>
          <button onClick={revokeAttestation}>Revoke Attestation</button>
        </>
      )}
    </div>
  );
};

export default App;
