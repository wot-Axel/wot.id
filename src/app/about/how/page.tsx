'use client';

// Footer is now included in the layout
import { AboutSubNav } from "@/components/AboutSubNav";

const AboutHow = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">About wot.id</h1>
      
      <AboutSubNav />
      
      <div className="legal-section">
        <h2>Technology Behind wot.id</h2>
        <div className="section-content">
          <p>
            wot.id is built using a combination of cutting-edge technologies:
          </p>
          
          <ul className="tech-list">
            <li><strong>Next.js:</strong> For a fast, responsive frontend experience</li>
            <li><strong>Ethereum Attestation Service (EAS):</strong> For creating and verifying blockchain attestations</li>
            <li><strong>Multi-Chain Architecture:</strong> Leveraging Ethereum L1 for identity and Optimism L2 for data storage and attestations</li>
            <li><strong>Dedicated RPC Providers:</strong> Enabling cross-chain operations without requiring users to switch networks</li>
            <li><strong>Reown AppKit:</strong> For secure wallet connections</li>
            <li><strong>Ceramic Network:</strong> For structured, decentralized data storage</li>
            <li><strong>Wagmi:</strong> For seamless Ethereum interactions</li>
          </ul>
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
            Private data is securely stored using Ceramic Network, giving users complete control over their information while maintaining privacy and security. Your data is never collected, stored, or analyzed on centralized servers.
          </p>
          
          <p>
            Our multi-chain architecture allows you to maintain your primary identity on Ethereum L1 while leveraging Optimism for specific features. This approach gives you the best of both worlds: the security and widespread adoption of Ethereum combined with the speed and lower costs of L2 solutions.
          </p>
          
          <h3>Key Features:</h3>
          <ul className="feature-list">
            <li><strong>Give Trust:</strong> Create attestations for others in your network using Optimism for lower costs</li>
            <li><strong>Get Trust:</strong> Receive attestations from trusted parties with fast verification</li>
            <li><strong>Private Data Storage:</strong> Securely store personal information with cryptographic access controls</li>
            <li><strong>Medical Data Management:</strong> Track and manage health records with granular permission settings</li>
            <li><strong>Digital Asset Management:</strong> Organize NFTs and digital collectibles from multiple blockchains in one interface</li>
            <li><strong>Cryptocurrency Tracking:</strong> Monitor your crypto holdings across different networks</li>
            <li><strong>Cross-Chain Operations:</strong> Interact with multiple blockchains without switching networks in your wallet</li>
            <li><strong>Seamless User Experience:</strong> Maintain your primary identity on Ethereum while leveraging other chains for specific features</li>
          </ul>
          
          <h3>How Our Multi-Chain Architecture Works:</h3>
          <ol className="feature-list">
            <li>Your primary identity remains on Ethereum L1, ensuring maximum security and interoperability</li>
            <li>Data storage and attestations utilize Optimism L2 for cost efficiency and speed</li>
            <li>Dedicated RPC providers connect to different networks without requiring you to switch</li>
            <li>All operations are performed with your explicit consent and control</li>
            <li>Digital assets from any blockchain can be tracked and managed in a unified interface</li>
            <li>Table existence checks are standardized across the application for consistent data handling</li>
          </ol>
        </div>
      </div>
      
      {/* Footer is now included in the layout */}
    </div>
  );
}

export default AboutHow;


export const viewport = {
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};
