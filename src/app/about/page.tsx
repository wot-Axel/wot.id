import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="legal-page">
      {/* Main headline temporarily hidden
      <h1 className="page-title">My Trusted Identity</h1>
      */}
      
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
          <p>
            Your digital identity should encompass all aspects of your life. From personal information and documents to real-world assets and medical data, our platform provides a comprehensive solution for managing your entire digital identity in one secure place.
          </p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>For Everywhere</h2>
        <div className="legal-content">
          <p>
            Your identity travels with you across the digital landscape. With blockchain-based attestations, you can prove your identity and credentials anywhere, anytime, without relying on centralized authorities or carrying physical documents.
          </p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>For Everyone (I choose)</h2>
        <div className="legal-content">
          <p>
            You have complete control over who can access your identity information. Share specific attestations with only the people and organizations you trust, maintaining privacy while still proving your credentials when needed.
          </p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>For Ever</h2>
        <div className="legal-content">
          <p>
            Blockchain technology ensures your identity attestations are permanent and immutable. Your digital identity will persist through time, providing a lasting record of your credentials and reputation that can't be erased or altered.
          </p>
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
      
      <Footer />
    </div>
  );
}

export default About;
