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
            Our mission is to create a user-centric identity system where people can manage all aspects of their digital lives in one secure, private, and user-controlled environment.
          </p>
          
          <p>
            The Web of Trust (WOT) is a concept that helps establish the authenticity of binding between a public key and its owner. It's a decentralized alternative to the centralized certificate authority model, allowing users to build a network of trust in a decentralized manner.
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
        </div>
      </div>
      
      {/* Footer is now included in the layout */}
    </div>
  );
}

export default AboutWho;
