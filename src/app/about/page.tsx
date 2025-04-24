'use client';

// Footer is now included in the layout
import { AboutSubNav } from "@/components/AboutSubNav";
import { useState } from "react";

const About = () => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="legal-page">
      {!showDetails ? (
        // Main About page view
        <>
          <h1 className="page-title">About wot.id</h1>

          {/* WHY */}
          <div className="legal-section">
            <h2>Why: A Trusted Identity for a Decentralized World</h2>
            <div className="section-content">
              <ul className="feature-list">
                <li><strong>Verifiability & Security:</strong> All actions and data are provable on-chain. Your identity is anchored to Ethereum mainnet with attestations, not managed by any central authority.</li>
                <li><strong>Strict Decentralization:</strong> No single point of failure. All digital information about you is stored in decentralized, peer-to-peer networks.</li>
                <li><strong>Privacy & Control:</strong> Only you decide who can access your data—never a platform, company, or server.</li>
                <li><strong>Future-Proofing:</strong> wot.id is designed to adapt as cryptography and blockchain ecosystems evolve, ensuring your data remains secure and accessible for decades.</li>
              </ul>
            </div>
          </div>

          {/* HOW */}
          <div className="legal-section">
            <h2>How: Our Architecture & Commitment to the Future</h2>
            <div className="section-content">
              <ul className="feature-list">
                <li><strong>Crypto-Agile Encryption:</strong> All data is encrypted client-side using a hybrid of classical (AES-GCM/X25519) and post-quantum (Kyber) cryptography. This ensures your data is safe from both current and future threats.</li>
                <li><strong>Metadata & Versioning:</strong> Every encrypted blob contains algorithm details, IVs, nonces, and timestamps—enabling seamless upgrades and key rotation as standards change.</li>
                <li><strong>Key Management:</strong> Designed for easy key rotation and multi-recipient support as PQC matures.</li>
                <li><strong>On-Chain Attestations:</strong> All identity claims are anchored to Ethereum mainnet and EAS, with L2 scalability via Optimism (never at the expense of credible neutrality).</li>
                <li><strong>No Local Storage:</strong> We never use browser localStorage for critical data—your secrets are never at risk from browser vulnerabilities.</li>
                <li><strong>Peer-to-Peer by Default:</strong> All data flows are strictly peer-to-peer, using decentralized storage and verifiable credentials.</li>
                <li><strong>Multi-Chain Ready:</strong> While Ethereum mainnet is the root of trust, wot.id is built to adapt to new chains as needed—never alt-L1s unless explicitly reconsidered.</li>
                <li><strong>Continuous PQC Readiness:</strong> We monitor the Ethereum and EAS ecosystem for PQC adoption and will migrate as soon as standards mature.</li>
                <li><strong>Open Documentation:</strong> All architectural decisions, cryptographic protocols, and upgrade roadmaps are publicly documented.</li>
              </ul>
            </div>
          </div>

          {/* WHO */}
          <div className="legal-section">
            <h2>Who: For Humans, Not Platforms</h2>
            <div className="section-content">
              <ul className="feature-list">
                <li><strong>Your Identity, Your Rules:</strong> Every wot.id is tied to a real human existence, verified by Ethereum Attestation Service, and enriched with data you control.</li>
                <li><strong>No Central Authority:</strong> There is no wot.id "admin"—the system is credibly neutral and strictly peer-to-peer.</li>
                <li><strong>Community-Driven:</strong> All design and development decisions are guided by the principles of decentralization, verifiability, and user empowerment.</li>
                <li><strong>Privacy by Design:</strong> No data is ever collected, stored, or analyzed on centralized servers.</li>
                <li><strong>Accessible to All:</strong> Anyone can join, contribute, and benefit from a provable, decentralized identity.</li>
              </ul>
            </div>
          </div>

          {/* JOIN */}
          <div className="legal-section">
            <h2>Join: Help Build the Future of Identity</h2>
            <div className="section-content">
              <ul className="feature-list">
                <li>Contribute code, ideas, or feedback—wot.id is open-source and welcomes all collaborators.</li>
                <li>Help us write the roadmap for PQC adoption, decentralized storage, and verifiable credentials.</li>
                <li>Review our documentation, audit our cryptography, or propose new features.</li>
                <li>Be part of a movement to give every human a secure, decentralized, and future-proof digital identity.</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        // Details view with AboutSubNav
        <>
          <h1 className="page-title">About wot.id</h1>
          
          <AboutSubNav />
          
          <div className="legal-section">
            <h2>About Web of Trust</h2>
            <div className="section-content">
              <p>
                The Web of Trust (WOT) is a concept in cryptography that helps establish the authenticity of binding between a public key and its owner. It's a decentralized alternative to the centralized certificate authority model.
              </p>
              
              <p>
                Our implementation uses the Ethereum Attestation Service to create verifiable claims about identity on the blockchain, allowing users to build a network of trust in a decentralized manner. Your primary identity remains on Ethereum L1, ensuring maximum security and interoperability with the broader ecosystem.
              </p>
            </div>
          </div>
          
          <div className="legal-section">
            <h2>How It Works</h2>
            <div className="section-content">
              <p>
                Users can create attestations that verify certain claims about themselves or others. These attestations are stored on the Optimism blockchain using the Ethereum Attestation Service, providing faster and more cost-effective transactions while maintaining security.
              </p>
              
              <p>
                By creating and receiving attestations, users build a web of trust that can be used to establish reputation and identity without relying on centralized authorities. All data remains under your control at all times.
              </p>
              
              <p>
                Our multi-chain architecture allows you to maintain your primary identity on Ethereum L1 while leveraging other networks like Optimism for specific features. This approach gives you the best of both worlds: the security and widespread adoption of Ethereum combined with the speed and lower costs of L2 solutions.
              </p>
            </div>
          </div>
          
          <div className="legal-section">
            <h2>Technology</h2>
            <div className="section-content">
              <p>
                This dApp is built using modern technologies that prioritize security, privacy, and user experience:
              </p>
              <ul className="tech-list">
                <li>Next.js for a fast, responsive frontend framework</li>
                <li>Ethereum Attestation Service for verifiable blockchain attestations</li>
                <li>Multi-chain architecture leveraging Ethereum L1 and Optimism L2</li>
                <li>Encrypted local storage for secure data storage</li>
                <li>Reown AppKit for secure wallet connection</li>
                <li>Dedicated RPC providers for seamless cross-chain operations</li>
              </ul>
              
              <p>
                What makes wot.id different from other identity solutions:
              </p>
              <ul className="tech-list">
                <li><strong>True Self-Sovereignty:</strong> Your data remains under your control at all times</li>
                <li><strong>Multi-Chain by Design:</strong> Leverages the strengths of different networks without forcing you to switch</li>
                <li><strong>Comprehensive Identity:</strong> Manages both on-chain and off-chain aspects of your identity</li>
                <li><strong>Privacy-First:</strong> Built from the ground up with privacy as a core principle</li>
                <li><strong>No Lock-In:</strong> Your identity isn't tied to our platform or any single blockchain</li>
              </ul>
            </div>
          </div>
        </>
      )}
      
      <div className="caution-text">
        <p>
          Caution: This dApp is experimental and not to be used without the necessary thorough knowledge of blockchain technology. 
          Any use is with a full understanding of and consent to the conditions provided in the disclaimer.
        </p>
      </div>
      
      <div className="button-bottom">
        {showDetails ? (
          <button className="button-primary" onClick={() => setShowDetails(false)}>Back to overview</button>
        ) : (
          <button className="button-primary" onClick={() => setShowDetails(true)}>Tell me more about wot.id</button>
        )}
      </div>
      
      {/* Footer is now included in the layout */}
    </div>
  );
}

export default About;



