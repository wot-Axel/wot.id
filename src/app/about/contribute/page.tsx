'use client';

// Footer is now included in the layout
import { AboutSubNav } from "@/components/AboutSubNav";
import Link from "next/link";

const AboutContribute = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">About wot.id</h1>
      
      <AboutSubNav />
      
      <div className="legal-section">
        <h2>Contribute Work and Capital</h2>
        <div className="section-content">
          <p>
            <strong>Anyone interested can contribute work and capital to wot.id.</strong>
          </p>
          
          <p>
            As a bootstrapping startup, we&apos;ve developed an innovative approach to compensation that we call a <strong>&quot;liquid equity split&quot;</strong> - a transparent, fair, and blockchain-aligned way to reward early contributors.
          </p>
          
          <p>
            wot.id welcomes contributions of both work and capital. Our approach to compensation differs from traditional startups, focusing on fair recognition of early contributions.
          </p>
          
          <p>
            There are many ways you can get involved and help shape the future of decentralized identity:
          </p>
          
          <ul className="feature-list">
            <li><strong>Development:</strong> Contribute code for our multi-chain architecture, implement new features, or fix bugs</li>
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
            As wot.id is transitioning from the ideation phase to a Minimum Viable Product, we don't yet have traditional funding available. This is where our innovative approach comes in.
          </p>
          
          <p>
            At this early stage, contributors work largely on a voluntary basis with future shares of ownership as compensation. Here's how it works:
          </p>
          
          <ul className="feature-list">
            <li>Your standard hourly rate is multiplied by the hours of work you contribute</li>
            <li>This sum entitles you to shares of ownership in relation to the valuation we achieve after the issuance of shares</li>
            <li>Once further funding is secured, direct compensation will begin, following industry standards</li>
            <li>Your contribution is tracked transparently, aligning with our decentralized principles</li>
          </ul>
          
          <p>
            This approach ensures that early contributors are fairly rewarded for their risk and effort when the project succeeds, without requiring immediate capital outlay from the project.
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
            <li>After selling a first tranche of 10%, we'll have a market-determined valuation</li>
            <li>Both cash and work contributions will then be attributed according to their value against this valuation</li>
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
            This approach aligns perfectly with our multi-chain architecture, which already leverages different blockchain networks to optimize for efficiency, cost, and user experience. Just as we&apos;ve designed our technical infrastructure to give users the best of both worlds, our economic model aims to give contributors fair compensation while maintaining our core principles.
          </p>
          
          <p>
            By participating in wot.id now, you&apos;re not just contributing to a project - you&apos;re helping to build a new model for how digital identity, data ownership, and value distribution can work in a more equitable digital future.
          </p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Development Resources</h2>
        <div className="section-content">
          <p>
            If you're interested in contributing to the development of wot.id, here are some resources to get you started:
          </p>
          
          <ul className="feature-list">
            <li><strong>GitHub Repository:</strong> <Link href="https://github.com/wot-Axel/wot.id" target="_blank">wot-Axel/wot.id</Link></li>
            <li><strong>Technical Documentation:</strong> Review our <Link href="/about/how">How It Works</Link> page for details on our multi-chain architecture</li>
            <li><strong>Development Environment:</strong> See our README for setup instructions</li>
          </ul>
          
          <p>
            We welcome contributions from developers of all skill levels. Our multi-chain architecture presents unique and interesting challenges that can help you grow as a blockchain developer.
          </p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Contact Us</h2>
        <div className="section-content">
          <p>
            If you're interested in contributing to wot.id or have questions about our liquid equity split model, please reach out:
          </p>
          
          <ul className="feature-list">
            <li><strong>Email:</strong> <a href="mailto:contact@wot.id">contact@wot.id</a></li>
            <li><strong>GitHub:</strong> <Link href="https://github.com/wot-Axel/wot.id" target="_blank">wot-Axel/wot.id</Link></li>
          </ul>
          
          <p>
            We look forward to collaborating with you to build the future of decentralized identity!
          </p>
        </div>
      </div>
      
      {/* Footer is now included in the layout */}
    </div>
  );
}

export default AboutContribute;
