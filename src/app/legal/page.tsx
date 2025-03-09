import { Footer } from "@/components/Footer";

const Legal = () => {
  return (
    <div className="legal-page">
      <h1 className="page-title">Legal Information</h1>
      
      <div className="legal-section">
        <h2>Responsible</h2>
        <div className="legal-content">
          <p>Dr. Axel Noack</p>
          <p>Behmstr. 1</p>
          <p>13357 Berlin</p>
          <p>Germany</p>
          <p className="support-note">(Your support is most welcome: axelnoack.eth)</p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Contact</h2>
        <div className="legal-content">
          <p>axel@wot.id</p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Disclaimer</h2>
        <div className="legal-content">
          <p>
            This distributed App (dApp) is experimental and for information purposes only. It intends to
            illustrate the advantages of a blockchain-based peer-to-peer system and
            offers assistance for the use of the Ethereum Attestation
            Service. Any information or functionality is provided to the best of our knowledge, but
            no guarantee of completeness or accuracy whatsoever can be given.
          </p>
          
          <p>
            In particular, no investment advice of any sort is given here. The use
            of the Ethereum Attestation Service is completely free, it is not
            necessary to buy a cryptocurrency.
          </p>
          
          <p>
            The Ethereum Blockchain and any other blockchain used in this projejet are peer-to-peer environments. Any activities performed there, such as
            storing information and making it available to others, or the use of cryptocurrencies for whatever purpose are always and
            exclusively the responsibility of the individual user only.
          </p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Data Protection</h2>
        <div className="legal-content">
          <p>
            This website uses necessary technical cookies only. By using this site,
            the user agrees to this. An explicit agreement by the user is not
            necessary.
          </p>
          <p>We do not collect, store, or analyse any user data.</p>
        </div>
      </div>
      
      <div className="legal-section">
        <h2>Copyright</h2>
        <div className="legal-content">
          <p>wot.id logo © Axel Noack</p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Legal;
