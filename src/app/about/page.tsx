'use client';

// Footer is now included in the layout
import { AboutSubNav } from "@/components/AboutSubNav";
import { useState } from "react";

const About = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'why' | 'how' | 'who' | 'join'>('why');
  
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
              onClick={() => { setShowDetails(true); setSelectedSection('why'); }}
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
          
          {(() => {
            switch (selectedSection) {
              case 'how':
                return (
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
                  </>
                );
              case 'who':
                return (
                  <div className="legal-section">
                    <h2>Who: For Humans, Not Platforms</h2>
                    <div className="section-content">
                      <ul className="feature-list">
                        <li><strong>Your Identity, Your Rules:</strong> Every wot.id is tied to a real human existence, verified by Ethereum Attestation Service, and enriched with data you control.</li>
                        <li><strong>No Central Authority:</strong> There is no wot.id "admin"—the system is credibly neutral and strictly peer-to-peer.</li>
                        <li><strong>Community-Driven:</strong> All design and development decisions are guided by the principles of decentralization, verifiability, and user empowerment.</li>
                        <li><strong>Privacy by Design:</strong> No data is ever collected, stored, or analyzed on centralized servers.</li>
                        <li><strong>Accessible to All:</strong> Anyone can join and benefit from a provable, decentralized identity.</li>
                      </ul>
                    </div>
                  </div>
                  </>
                );
              case 'join':
                return (
                  <>
                    <div className="legal-section">
                    <h2>Join Work and Capital</h2>
                    <div className="section-content">
                      <p>
                        <strong>Anyone interested can join by offering work or capital to wot.id.</strong>
                      </p>
                      <p>
                        As a bootstrapping startup, we&apos;ve developed an innovative approach to compensation called a <strong>&quot;liquid equity split&quot;</strong>—a transparent, fair, and blockchain-aligned way to reward early participants.
                      </p>
                      <p>
                        wot.id welcomes both work and capital. Our approach to compensation differs from traditional startups, focusing on fair recognition of early participation.
                      </p>
                      <p>
                        There are many ways you can get involved and help shape the future of decentralized identity:
                      </p>
                      <ul className="feature-list">
                        <li><strong>Development:</strong> Join by contributing code for our multi-chain architecture, implementing new features, or fixing bugs</li>
                        <li><strong>Design:</strong> Help improve the user interface and experience of our privacy-first platform</li>
                        <li><strong>Documentation:</strong> Write guides, tutorials, or improve existing documentation</li>
                        <li><strong>Testing:</strong> Help identify and report issues across different blockchain networks</li>
                        <li><strong>Community:</strong> Spread the word and help grow the wot.id ecosystem</li>
                        <li><strong>Investment:</strong> Participate in our upcoming auction-based funding model</li>
                      </ul>
                    </div>
                  </div>
                  <div className="legal-section">
                    <h2>The Liquid Equity Split Explained</h2>
                    <div className="section-content">
                      <p>
                        As wot.id is transitioning from ideation to a Minimum Viable Product, we don&apos;t yet have traditional funding available. This is where our innovative approach comes in.
                      </p>
                      <p>
                        At this early stage, participants work largely on a voluntary basis with future shares of ownership as compensation. Here&apos;s how it works:
                      </p>
                      <ul className="feature-list">
                        <li>Your standard hourly rate is multiplied by the hours of work you contribute</li>
                        <li>This sum entitles you to shares of ownership in relation to the valuation we achieve after the issuance of shares</li>
                        <li>Once further funding is secured, direct compensation will begin, following industry standards</li>
                        <li>Your participation is tracked transparently, aligning with our decentralized principles</li>
                      </ul>
                      <p>
                        This approach ensures that early participants are fairly rewarded for their risk and effort when the project succeeds, without requiring immediate capital outlay from the project.
                      </p>
                    </div>
                  </div>
                  <div className="legal-section">
                    <h2>Valuation Mechanism</h2>
                    <div className="section-content">
                      <p>
                        Our valuation approach is as innovative as our technology. We plan to sell shares of ownership in wot.id to the public through an auction mechanism:
                      </p>
                      <ul className="feature-list">
                        <li>Shares of 1% ownership will be sold consecutively through online auctions</li>
                        <li>Each auction will start at a higher price (e.g., 100 Ether) and decrease to a lower threshold (e.g., 1 Ether) over 21 days</li>
                        <li>Once one 1% share is sold, the next auction begins for the next 1% share</li>
                        <li>After selling a first tranche of 10%, we&apos;ll have a market-determined valuation</li>
                        <li>Both cash and work participation will then be attributed according to their value against this valuation</li>
                      </ul>
                      <p>
                        Our intention is to establish this dynamic or liquid equity split as a standard for future transactions. Anyone will be able to see the value of wot.id and their shares in it in real-time, perfectly aligned with our principles of transparency and decentralization.
                      </p>
                    </div>
                  </div>
                  <div className="legal-section">
                    <h2>Legal Framework</h2>
                    <div className="section-content">
                      <p>
                        To provide a solid foundation for our innovative approach, wot.id will be anchored in the real world as a Cooperative under European Law. This structure is chosen specifically because it aligns with our core values.
                      </p>
                      <p>
                        The Cooperative will serve three specific purposes:
                      </p>
                      <ul className="feature-list">
                        <li>To safeguard the digital identity of its members</li>
                        <li>To compensate them fairly and directly for the use of their data</li>
                        <li>To facilitate individual and collective growth through insights from data</li>
                      </ul>
                      <p>
                        Importantly, our purpose is <em>explicitly not</em> the maximization of profits for outside shareholders. This legal structure supports our technical architecture&apos;s focus on user control and privacy.
                      </p>
                    </div>
                  </div>
                  <div className="legal-section">
                    <h2>Long-term Vision for Value Distribution</h2>
                    <div className="section-content">
                      <p>
                        Our ultimate vision goes beyond traditional business models. At some stage, all value created on wot.id will be distributed immediately and continuously as micro-transactions to its participants.
                      </p>
                      <p>
                        This approach aligns perfectly with our multi-chain architecture, which already leverages different blockchain networks to optimize for efficiency, cost, and user experience. Just as we&apos;ve designed our technical infrastructure to give users the best of both worlds, our economic model aims to give participants fair compensation while maintaining our core principles.
                      </p>
                      <p>
                        By joining wot.id now, you&apos;re not just joining a project—you&apos;re helping to build a new model for how digital identity, data ownership, and value distribution can work in a more equitable digital future.
                      </p>
                    </div>
                  </div>
                  <div className="legal-section">
                    <h2>Development Resources</h2>
                    <div className="section-content">
                      <p>
                        If you&apos;re interested in joining the development of wot.id, here are some resources to get you started:
                      </p>
                      <ul className="feature-list">
                        <li><strong>GitHub Repository:</strong> <a href="https://github.com/wot-Axel/wot.id" target="_blank" rel="noopener noreferrer">wot-Axel/wot.id</a></li>
                        <li><strong>Technical Documentation:</strong> Review our <a href="/about/how">How It Works</a> page for details on our multi-chain architecture</li>
                        <li><strong>Development Environment:</strong> See our README for setup instructions</li>
                      </ul>
                      <p>
                        We welcome participation from developers of all skill levels. Our multi-chain architecture presents unique and interesting challenges that can help you grow as a blockchain developer.
                      </p>
                    </div>
                  </div>
                  <div className="legal-section">
                    <h2>Contact Us</h2>
                    <div className="section-content">
                      <p>
                        If you&apos;re interested in joining wot.id or have questions about our liquid equity split model, please reach out:
                      </p>
                      <ul className="feature-list">
                        <li><strong>Email:</strong> <a href="mailto:contact@wot.id">contact@wot.id</a></li>
                        <li><strong>GitHub:</strong> <a href="https://github.com/wot-Axel/wot.id" target="_blank" rel="noopener noreferrer">wot-Axel/wot.id</a></li>
                      </ul>
                      <p>
                        We look forward to collaborating with you to build the future of decentralized identity!
                      </p>
                    </div>
                  </div>
                  </>
                );
              default:
                return (
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
                  </>
                );
            }
          })()}
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <button
              className="about-back-btn"
              onClick={() => setShowDetails(false) }
              style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', borderRadius: '2rem', background: '#eee', color: '#222', border: '1px solid #222', cursor: 'pointer' }}
            >
              Back to main benefits
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default About;
