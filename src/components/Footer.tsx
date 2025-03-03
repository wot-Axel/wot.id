import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <div id="section_footer">
      <div className='text-center py-4'>
        < Link href="/legal" className='btn btn-link'>
          Legal 
        </Link>
        <span> | </ span>
        <Link href="https://app.ens.domains/wot.eth" target="_blank" className='btn btn-link'>
          Support: wot.eth 
        </Link>
        <span> | </span>
        <Link href="/about" className='btn btn-link'>
          About 
        </Link>
      </div>
    </div>
  );
}
