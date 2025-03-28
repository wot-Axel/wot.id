import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="main-footer">
        <nav className="footer-links">
          <Link href="/legal" className="footer-link">
            Legal
          </Link>
          <div className="footer-divider"></div>
          <Link href="https://app.ens.domains/wot.eth" target="_blank" className="footer-link">
            Support: wot.eth
          </Link>
          <div className="footer-divider"></div>
          <Link href="/about" className="footer-link">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
