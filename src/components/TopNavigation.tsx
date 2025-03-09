'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';

export const TopNavigation = () => {
  const pathname = usePathname();
  const { isConnected } = useAppKitAccount();
  
  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="top-nav-container">
      <div className="top-nav">
        <div className="nav-left-section">
          <div className="nav-logo">
            <Link href="/">
              <Image 
                src="/wot_logo_light.png" 
                alt="wot.id logo" 
                width={40} 
                height={40} 
                priority 
              />
            </Link>
          </div>
          
          <div className="site-name">
            <Link href="/">
              wot.id
            </Link>
          </div>
          
          <nav className="nav-links">
            <Link 
              href="/read" 
              className={`nav-link ${isActive('/read') ? 'active' : ''}`}
            >
              Read
            </Link>
            <Link 
              href="/write" 
              className={`nav-link ${isActive('/write') ? 'active' : ''}`}
            >
              Write
            </Link>            
            {isConnected ? (
              <Link 
                href="/account" 
                className={`nav-link ${isActive('/account') ? 'active' : ''}`}
              >
                Account
              </Link>
            ) : (
              <div className="connect-wrapper">
                {/* @ts-expect-error Add this line while our team fix the upgrade to react 19 for global components */}
                <appkit-button />
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
