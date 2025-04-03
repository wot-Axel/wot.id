'use client';

// Footer is now included in the layout
import { AboutSubNav } from "@/components/AboutSubNav";

const AboutWho = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">About wot.id</h1>
      
      <AboutSubNav />
      
      <div className="legal-section">
        <h2>Who We Are</h2>
        <div className="legal-content">
          <p>
            wot.id is a decentralized identity platform built on the principles of the Web of Trust (WOT) concept in cryptography. 
            We are a team of blockchain enthusiasts and privacy advocates who believe that individuals should have complete control over their digital identities.
          </p>
          
          <p>
            Our mission is to create a user-centric identity system where people can manage all aspects of their digital lives in one secure, private, and user-controlled environment. We believe your data belongs to you alone, and should never be collected, stored, or analyzed on centralized servers without your explicit consent.
          </p>
          
          <p>
            The Web of Trust (WOT) is a concept that helps establish the authenticity of binding between a public key and its owner. It's a decentralized alternative to the centralized certificate authority model, allowing users to build a network of trust in a decentralized manner.
          </p>
          
          <p>
            Our platform leverages a multi-chain architecture that maintains your primary identity on Ethereum L1 while utilizing other networks like Optimism for specific features that benefit from lower costs and faster transactions. This approach gives you the best of both worlds without requiring you to manually switch networks or compromise on security.
          </p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Our Vision</h2>
        <div className="legal-content">
          <p>
            We envision a world where individuals have complete sovereignty over their digital identities, where personal data is not controlled by centralized entities, and where trust can be established directly between peers without intermediaries.
          </p>
          
          <p>
            wot.id aims to be the foundation for this new paradigm of digital identity, providing the tools and infrastructure needed for individuals to take control of their online presence and personal information.
          </p>
          
          <p>
            Our technical approach differentiates us from other identity solutions in several key ways:
          </p>
          
          <ul className="feature-list">
            <li><strong>True Self-Sovereignty:</strong> Your data remains under your control at all times, with no backdoors or hidden access</li>
            <li><strong>Multi-Chain by Design:</strong> We leverage the strengths of different blockchain networks without forcing you to switch between them</li>
            <li><strong>Comprehensive Identity:</strong> We manage both on-chain assets and off-chain personal information in one unified interface</li>
            <li><strong>Privacy-First:</strong> Our platform is built from the ground up with privacy as a core principle, not as an afterthought</li>
            <li><strong>No Lock-In:</strong> Your identity isn't tied to our platform or any single blockchain, giving you true portability</li>
          </ul>
        </div>
      </div>
      
      {/* Footer is now included in the layout */}
    </div>
  );
}

export default AboutWho;
