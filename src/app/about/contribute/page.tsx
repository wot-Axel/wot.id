'use client';

// Footer is now included in the layout
import { AboutSubNav } from "@/components/AboutSubNav";

const AboutContribute = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">Contribute to wot.id</h1>
      
      <AboutSubNav />
      
      <div className="legal-section">
        <h2>Join Our Community</h2>
        <div className="legal-content">
          <p>
            wot.id is an open project that welcomes contributions from the community. There are many ways you can get involved and help shape the future of decentralized identity:
          </p>
          
          <ul className="feature-list">
            <li><strong>Development:</strong> Contribute code, fix bugs, or add new features</li>
            <li><strong>Design:</strong> Help improve the user interface and experience</li>
            <li><strong>Documentation:</strong> Write guides, tutorials, or improve existing documentation</li>
            <li><strong>Testing:</strong> Help identify and report issues</li>
            <li><strong>Community:</strong> Spread the word and help grow the wot.id ecosystem</li>
          </ul>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Development Resources</h2>
        <div className="legal-content">
          <p>
            If you're interested in contributing to the development of wot.id, here are some resources to get you started:
          </p>
          
          <ul className="feature-list">
            <li><strong>GitHub Repository:</strong> Our code is open source and available for contributions</li>
            <li><strong>Development Guide:</strong> Learn how to set up your development environment</li>
            <li><strong>Issue Tracker:</strong> Find open issues that need attention</li>
            <li><strong>Coding Standards:</strong> Understand our coding conventions and practices</li>
          </ul>
          
          <p>
            We believe in the power of community-driven development and welcome contributions from developers of all skill levels. Whether you're fixing a small bug or implementing a major feature, your contribution is valuable to the project.
          </p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Contact Us</h2>
        <div className="legal-content">
          <p>
            If you have questions, ideas, or want to get involved with the wot.id project, please reach out to us through one of the following channels:
          </p>
          
          <ul className="feature-list">
            <li><strong>Email:</strong> contact@wot.id</li>
            <li><strong>Discord:</strong> Join our community server</li>
            <li><strong>Twitter:</strong> Follow us for updates</li>
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
