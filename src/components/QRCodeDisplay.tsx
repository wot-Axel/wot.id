'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';

interface QRCodeDisplayProps {
  data: string;
  title?: string;
  description?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  data, 
  title = 'Scan QR Code', 
  description = 'Scan this QR code to make an attestation' 
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="qr-code-container">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="qr-code">
        <QRCode 
          value={data} 
          size={200}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
        />
      </div>
      <div className="qr-code-data">
        <p className="qr-data-text">{data.length > 30 ? `${data.substring(0, 15)}...${data.substring(data.length - 15)}` : data}</p>
        <button 
          className="copy-button" 
          onClick={copyToClipboard}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
