import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">About</h1>
      
      <div className="legal-section">
        <h2>Caution</h2>
        <div className="legal-content">
          <p>
            This dApp is experimental and not to be used without the necessary thorough knowledge of blockchain technology.
          </p>
          
          <p>
            Any use is with a full understanding of and consent to the conditions provided in the disclaimer.
          </p>
        </div>
      </div>
      
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
      
      <Footer />
    </div>
  );
}

export default About;
