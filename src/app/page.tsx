'use client';

// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
//import { InfoList } from "@/components/InfoList";
import ScanButton from '@/components/ScanButton';
import Image from 'next/image';
// Footer is now included in the layout
import './globals.css';
import { useAppKitAccount } from '@reown/appkit/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isConnected } = useAppKitAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/me');
    }
  }, [isConnected, router]);

  return (
    <div className={"pages"}>
      <Image src="/wot_logo_light.png" alt="wot_logo_light" width={150} height={150} priority />
      <h1>Just me</h1>
      <h3>My safe Identity on the Web Of Trust</h3>

      <ConnectButton />
      
      <div className="advice">
        <p>
          <b>Built on the Ethereum Blockchain</b><br/>
          This is an experimental project. Proceed with caution.
        </p>
      </div>
    </div>
  );
}


//<br/>Go to <a href="https://cloud.reown.com" target="_blank" className="link-button" rel="Reown Cloud">Reown Cloud</a> to get your own.