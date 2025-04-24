"use client";

import React, { useState } from "react";
import { useAppKitNetwork, useAppKitState } from "@reown/appkit/react";
import { networks } from "@/config";

export const NetworkSwitcher: React.FC = () => {
  const { switchNetwork } = useAppKitNetwork();
  const { activeChain, loading } = useAppKitState();
  const [error, setError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (network: any) => {
    if (network.id === activeChain) return;
    setError("");
    setIsSwitching(true);
    try {
      await switchNetwork(network);
    } catch (err: any) {
      setError(
        err?.message ||
          "Network switch failed. Please try again or switch in your wallet."
      );
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div style={{ margin: "1rem 0" }}>
      <div style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Network</div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {networks.map((network) => (
          <button
            key={network.id}
            onClick={() => handleSwitch(network)}
            disabled={isSwitching || loading || network.id === activeChain}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: 6,
              border: network.id === activeChain ? "2px solid #222" : "1px solid #bbb",
              background: network.id === activeChain ? "#222" : "#fff",
              color: network.id === activeChain ? "#fff" : "#222",
              fontWeight: network.id === activeChain ? 700 : 400,
              opacity: isSwitching && network.id !== activeChain ? 0.6 : 1,
              cursor:
                isSwitching || loading || network.id === activeChain
                  ? "not-allowed"
                  : "pointer",
              transition: "all 0.15s"
            }}
          >
            {network.name}
            {network.id === activeChain && " (Active)"}
          </button>
        ))}
      </div>
      {error && (
        <div style={{ color: "#b00", marginTop: "0.5rem" }}>{error}</div>
      )}
    </div>
  );
};
