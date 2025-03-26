'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';

export const TopNavigation = () => {
  const pathname = usePathname();
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  
  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="top-nav-container">
      <div className="top-nav">
        <div className="nav-left-section">
          <div className="nav-logo">
            <Link href={isConnected ? "/me" : "/"}>
              <Image 
                src="/wot_logo_light.png" 
                alt="wot.id logo" 
                width={36} 
                height={36} 
                priority 
              />
            </Link>
          </div>
          
          <div className="site-name">
            <Link href={isConnected ? "/me" : "/"}>
              wot.id
            </Link>
          </div>
          
          <nav className="nav-links">
            <Link 
              href="/write" 
              className={`nav-link ${isActive('/write') ? 'active' : ''}`}
            >
              Give Trust
            </Link>
            <Link 
              href="/read" 
              className={`nav-link ${isActive('/read') ? 'active' : ''}`}
            >
              Get Trust
            </Link>
          </nav>
          
          <div className="nav-right">
            {isConnected && (
              <Link 
                href="/me" 
                className={`nav-link ${isActive('/me') ? 'active' : ''}`}
              >
                Me
              </Link>
            )}
            
            {!isConnected && (
              <div className="connect-wrapper">
                <button 
                  onClick={() => open()}
                  className="connect-button nav-connect-button"
                >
                  Connect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
