// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
//import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from 'next/image';
import { Footer } from "@/components/Footer";
import './globals.css';

export default function Home() {

  return (
    <div className={"pages"}>
      <Image src="/wot_logo_light.png" alt="wot_logo_light" width={150} height={150} priority />
      <h1>Just me</h1>
      <h3>My safe Identity on the Web Of Trust</h3>

      <ConnectButton />
      <ActionButtonList />
      <div className="advice">
        <p>
          This is an experimental project.<b /> Proceed with caution.
          
        </p>
      </div>
      <br />
      <br />
      <Footer />
    </div>
  );
}


//<br/>Go to <a href="https://cloud.reown.com" target="_blank" className="link-button" rel="Reown Cloud">Reown Cloud</a> to get your own.