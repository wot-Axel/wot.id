// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
//import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from 'next/image';
import { Footer } from "@/components/Footer";


export default function Home() {

  return (
    <div className={"pages"}>
      <Image src="/wot_logo_light.png" alt="wot_logo_light" width={150} height={150} priority />
      <h1>Just me</h1>
      <h3>My Trusted Identity on the Ethereum Blockchain</h3>

      <ConnectButton />
      <ActionButtonList />
      <div className="advice">
        <p>
          This projectId only works on localhost. <br/>Go to <a href="https://cloud.reown.com" target="_blank" className="link-button" rel="Reown Cloud">Reown Cloud</a> to get your own.
        </p>
      </div>
      <Footer />
    </div>
  );
}