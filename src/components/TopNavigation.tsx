'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import { useWalletPreferences } from '@/hooks/useWalletPreferences';

export const TopNavigation = () => {
  const pathname = usePathname();
  const { isConnected } = useAppKitAccount();
  const { openModal } = useWalletPreferences();
  
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
            {/* Always show links, but handle click differently when not logged in */}
            <Link 
              href={isConnected ? "/message" : "/#"} 
              className={`nav-link ${isActive('/message') ? 'active' : ''}`}
              onClick={!isConnected ? (e) => {
                e.preventDefault();
                openModal();
              } : undefined}
            >
              Message
            </Link>
            <Link 
              href={isConnected ? "/transfer" : "/#"} 
              className={`nav-link ${isActive('/transfer') ? 'active' : ''}`}
              onClick={!isConnected ? (e) => {
                e.preventDefault();
                openModal();
              } : undefined}
            >
              Transfer
            </Link>
            <Link 
              href={isConnected ? "/trust" : "/#"} 
              className={`nav-link ${isActive('/trust') || isActive('/write') || isActive('/read') ? 'active' : ''}`}
              onClick={!isConnected ? (e) => {
                e.preventDefault();
                openModal();
              } : undefined}
            >
              Trust
            </Link>
          </nav>
          
          <div className="nav-right">
            <Link 
              href={isConnected ? "/me" : "/#"} 
              className={`nav-link ${isActive('/me') ? 'active' : ''}`}
              onClick={!isConnected ? (e) => {
                e.preventDefault();
                openModal();
              } : undefined}
            >
              Me
            </Link>
            
            {/* Migrate button removed */}
            
            {!isConnected && (
              <div className="connect-wrapper">
                <button 
                  onClick={() => openModal()}
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
