import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ url, size = 180 }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: {
        dark: '#00f2fe',
        light: '#000000'
      }
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [url, size]);

  if (!qrDataUrl) {
    return (
      <div 
        className="flex items-center justify-center bg-black border border-cyan-500/30 rounded-xl"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-cyan-400 font-mono animate-pulse">Generating QR...</span>
      </div>
    );
  }

  return (
    <div className="p-2 bg-black border border-delphini-cyan/40 rounded-xl shadow-glow-cyan">
      <img src={qrDataUrl} alt="Remote Pair QR Code" className="rounded-lg select-none" />
    </div>
  );
};
