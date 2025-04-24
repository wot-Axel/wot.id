'use client';

import { AboutSubNav } from "@/components/AboutSubNav";
import { useState } from "react";

const About = () => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="legal-page">
      {!showDetails ? (
        <>
          <h1 className="page-title">My Trusted Identity</h1>
          <div className="legal-section">
            <h2>For Everything</h2>
            <div className="section-content">
              <ul className="feature-list">
                <li>I can store all aspects of my life in one place, from personal documents to digital assets</li>
                <li>My personal information is securely managed using blockchain technology</li>
                <li>I can organize my documents digitally with cryptographic verification</li>
                <li>My real-world assets are tracked and verified with immutable records</li>
                <li>My medical data is accessible when I need it, but only to those I explicitly authorize</li>
                <li>My digital assets from multiple blockchains are managed in a unified interface</li>
              </ul>
            </div>
          </div>
          <div className="legal-section">
            <h2>For Everywhere</h2>
            <div className="section-content">
              <ul className="feature-list">
                <li>I can access my identity from anywhere in the world with just a web browser</li>
                <li>My credentials are always available when I need them, backed by blockchain technology</li>
                <li>I don't need to carry physical documents anymore, reducing risk of loss or theft</li>
                <li>I can prove who I am without relying on centralized authorities that may be compromised</li>
                <li>My blockchain-based attestations are universally verifiable across multiple networks</li>
                <li>My identity works seamlessly across different blockchain ecosystems</li>
              </ul>
            </div>
          </div>
          <div className="legal-section">
            <h2>For Everyone (I choose)</h2>
            <div className="section-content">
              <ul className="feature-list">
                <li>I decide who can see my information through cryptographic access controls</li>
                <li>I can share specific credentials with only those I trust, with granular permissions</li>
                <li>I maintain my privacy while still proving my identity using zero-knowledge proofs</li>
                <li>I control which organizations have access to my data, not the other way around</li>
                <li>I can revoke access to my information at any time with blockchain-based permission management</li>
                <li>My data is never collected, stored, or analyzed on centralized servers</li>
              </ul>
            </div>
          </div>
          <div className="legal-section">
            <h2>For Ever</h2>
            <div className="section-content">
              <ul className="feature-list">
                <li>My identity attestations are permanent and immutable</li>
                <li>I have a lasting record of my credentials that can't be erased</li>
                <li>My reputation is preserved through time</li>
                <li>I don't have to worry about losing important documents</li>
                <li>My digital identity will persist as long as the blockchain exists</li>
              </ul>
            </div>
          </div>
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button
              className="about-tell-me-more-btn"
              onClick={() => setShowDetails(true)}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1.1rem',
                borderRadius: '2rem',
                background: '#fff',
                color: '#222',
                border: '1.5px solid #222',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              Tell me more about wot.id
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="page-title">About wot.id</h1>
          <AboutSubNav />
          {/* Insert the detailed About content here, as in commit fde4b9f */}
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button
              className="about-back-btn"
              onClick={() => setShowDetails(false)}
              style={{
                padding: '0.75rem 2rem',
                fontSize: '1.1rem',
                borderRadius: '2rem',
                background: '#eee',
                color: '#222',
                border: '1px solid #222',
                cursor: 'pointer'
              }}
            >
              Back to overview
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default About;

