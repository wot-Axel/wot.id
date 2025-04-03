'use client';

// Footer is now included in the layout
import { AboutSubNav } from "@/components/AboutSubNav";

const AboutWhy = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">Why wot.id</h1>
      
      <AboutSubNav />
      
      <div className="legal-section">
        <h2>Why We Built wot.id</h2>
        <div className="legal-content">
          <p>
            In today&apos;s digital world, our identities are fragmented across countless platforms and services. 
            Personal information is often stored in centralized databases vulnerable to breaches, and users have little control over how their data is used.
          </p>
          
          <p>
            We built wot.id to address these fundamental issues with digital identity:
          </p>
          
          <ul className="feature-list">
            <li><strong>Privacy:</strong> Your personal information should be yours to control, never collected or analyzed on centralized servers</li>
            <li><strong>Security:</strong> Blockchain technology provides immutable, tamper-proof records with cryptographic verification</li>
            <li><strong>Sovereignty:</strong> You should decide who can access your information and when, with granular permission controls</li>
            <li><strong>Portability:</strong> Your identity should be accessible from anywhere, anytime, across multiple blockchain networks</li>
            <li><strong>Trust:</strong> Attestations from trusted parties create a web of trust without centralized authorities</li>
            <li><strong>Efficiency:</strong> Multi-chain architecture leverages the right network for each feature, optimizing for cost and speed</li>
          </ul>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>The Problem with Traditional Identity</h2>
        <div className="legal-content">
          <p>
            Traditional identity systems suffer from several critical problems:
          </p>
          
          <ul className="feature-list">
            <li>Centralized storage creates single points of failure</li>
            <li>Users have limited control over their personal information</li>
            <li>Identity verification is repetitive and inefficient across services</li>
            <li>Physical documents can be lost, damaged, or stolen</li>
            <li>Reliance on centralized authorities creates bottlenecks and vulnerabilities</li>
          </ul>
          
          <p>
            wot.id solves these problems by putting you in control of your identity, using blockchain technology to secure your information, and leveraging attestations to create a decentralized web of trust.
          </p>
          
          <p>
            Our multi-chain approach provides additional benefits:
          </p>
          
          <ul className="feature-list">
            <li><strong>Cost Efficiency:</strong> Using Optimism for data storage and attestations reduces transaction costs</li>
            <li><strong>Speed:</strong> Layer 2 solutions process transactions faster than Ethereum mainnet</li>
            <li><strong>Seamless Experience:</strong> Users maintain their primary identity on Ethereum L1 without manual network switching</li>
            <li><strong>Future-Proof:</strong> The architecture can incorporate additional chains as the ecosystem evolves</li>
            <li><strong>Interoperability:</strong> Assets and attestations from multiple chains can be managed in one interface</li>
          </ul>
        </div>
      </div>
      
      {/* Footer is now included in the layout */}
    </div>
  );
}

export default AboutWhy;
