import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">My Trusted Identity</h1>
      
      {/* About Web of Trust section temporarily hidden
      <div className="legal-section">
        <h2>About Web of Trust</h2>
        <div className="legal-content">
          <p>
            The Web of Trust (WOT) is a concept in cryptography that helps establish the authenticity of binding between a public key and its owner. It's a decentralized alternative to the centralized certificate authority model.
          </p>
          
          <p>
            Our implementation uses the Ethereum Attestation Service to create verifiable claims about identity on the blockchain, allowing users to build a network of trust in a decentralized manner.
          </p>
        </div>
      </div>
      */}
      
      {/* How It Works section temporarily hidden
      <div className="legal-section">
        <h2>How It Works</h2>
        <div className="legal-content">
          <p>
            Users can create attestations that verify certain claims about themselves or others. These attestations are stored on the Optimism blockchain using the Ethereum Attestation Service.
          </p>
          
          <p>
            By creating and receiving attestations, users build a web of trust that can be used to establish reputation and identity without relying on centralized authorities.
          </p>
        </div>
      </div>
      */}
      
      <div className="legal-section">
        <h2>For Everything</h2>
        <div className="legal-content">
          <ul className="feature-list">
            <li>I can store all aspects of my life in one place</li>
            <li>My personal information is securely managed</li>
            <li>I can organize my documents digitally</li>
            <li>My real-world assets are tracked and verified</li>
            <li>My medical data is accessible when I need it</li>
          </ul>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>For Everywhere</h2>
        <div className="legal-content">
          <ul className="feature-list">
            <li>I can access my identity from anywhere in the world</li>
            <li>My credentials are always available when I need them</li>
            <li>I don't need to carry physical documents anymore</li>
            <li>I can prove who I am without relying on centralized authorities</li>
            <li>My blockchain-based attestations are universally verifiable</li>
          </ul>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>For Everyone (I choose)</h2>
        <div className="legal-content">
          <ul className="feature-list">
            <li>I decide who can see my information</li>
            <li>I can share specific credentials with only those I trust</li>
            <li>I maintain my privacy while still proving my identity</li>
            <li>I control which organizations have access to my data</li>
            <li>I can revoke access to my information at any time</li>
          </ul>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>For Ever</h2>
        <div className="legal-content">
          <ul className="feature-list">
            <li>My identity attestations are permanent and immutable</li>
            <li>I have a lasting record of my credentials that can't be erased</li>
            <li>My reputation is preserved through time</li>
            <li>I don't have to worry about losing important documents</li>
            <li>My digital identity will persist as long as the blockchain exists</li>
          </ul>
        </div>
      </div>
      
      {/* Technology section temporarily hidden
      <div className="legal-section">
        <h2>Technology</h2>
        <div className="legal-content">
          <p>
            This dApp is built using:
          </p>
          <ul className="tech-list">
            <li>Next.js for the frontend framework</li>
            <li>Ethereum Attestation Service for blockchain attestations</li>
            <li>Optimism for scalable blockchain transactions</li>
            <li>Reown AppKit for wallet connection</li>
          </ul>
        </div>
      </div>
      */}
      
      <div className="caution-text">
        <p>
          Caution: This dApp is experimental and not to be used without the necessary thorough knowledge of blockchain technology. 
          Any use is with a full understanding of and consent to the conditions provided in the disclaimer.
        </p>
      </div>
      
      <Footer />
    </div>
  );
}

export default About;
