'use client';

import { Footer } from "@/components/Footer";
import { AboutSubNav } from "@/components/AboutSubNav";

const AboutHow = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">How wot.id Works</h1>
      
      <AboutSubNav />
      
      <div className="legal-section">
        <h2>Technology Behind wot.id</h2>
        <div className="legal-content">
          <p>
            wot.id is built using a combination of cutting-edge technologies:
          </p>
          
          <ul className="tech-list">
            <li><strong>Next.js:</strong> For a fast, responsive frontend experience</li>
            <li><strong>Ethereum Attestation Service (EAS):</strong> For creating and verifying blockchain attestations</li>
            <li><strong>Optimism:</strong> For scalable, low-cost blockchain transactions</li>
            <li><strong>Reown AppKit:</strong> For secure wallet connections</li>
            <li><strong>Tableland:</strong> For secure, private data storage on the Optimism chain</li>
            <li><strong>Wagmi:</strong> For seamless Ethereum interactions</li>
          </ul>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>How It Works</h2>
        <div className="legal-content">
          <p>
            Users can create attestations that verify certain claims about themselves or others. These attestations are stored on the Optimism blockchain using the Ethereum Attestation Service.
          </p>
          
          <p>
            By creating and receiving attestations, users build a web of trust that can be used to establish reputation and identity without relying on centralized authorities.
          </p>
          
          <p>
            Private data is securely stored using Tableland on the Optimism chain, giving users complete control over their information while maintaining privacy and security.
          </p>
          
          <h3>Key Features:</h3>
          <ul className="feature-list">
            <li><strong>Give Trust:</strong> Create attestations for others in your network</li>
            <li><strong>Get Trust:</strong> Receive attestations from trusted parties</li>
            <li><strong>Private Data Storage:</strong> Securely store personal information</li>
            <li><strong>Medical Data Management:</strong> Track and manage health records</li>
            <li><strong>Digital Asset Management:</strong> Organize NFTs and digital collectibles</li>
            <li><strong>Cryptocurrency Tracking:</strong> Monitor your crypto holdings</li>
          </ul>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default AboutHow;
