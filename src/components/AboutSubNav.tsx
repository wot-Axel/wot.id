'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const AboutSubNav = () => {
  const pathname = usePathname();
  
  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="about-subnav">
      <Link 
        href="/about/who" 
        className={`subnav-link ${isActive('/about/who') ? 'active' : ''}`}
      >
        Who
      </Link>
      <Link 
        href="/about/why" 
        className={`subnav-link ${isActive('/about/why') ? 'active' : ''}`}
      >
        Why
      </Link>
      <Link 
        href="/about/how" 
        className={`subnav-link ${isActive('/about/how') ? 'active' : ''}`}
      >
        How
      </Link>
      <Link 
        href="/about/contribute" 
        className={`subnav-link ${isActive('/about/contribute') ? 'active' : ''}`}
      >
        Contribute
      </Link>
    </div>
  );
};
