'use client';

// A code drawn as a QR, as its message would carry it: by `qrcode`, the
// application's own; ReboSchedule gives the code, not the picture.

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export function Qr({ text, size = 160, className }: { text: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let on = true;
    void QRCode.toDataURL(text, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' }).then((url) => on && setSrc(url));
    return () => {
      on = false;
    };
  }, [text, size]);
  // biome-ignore lint/performance/noImgElement: a QR made in the page, as data.
  return src ? <img src={src} alt="QR" width={size} height={size} className={className} /> : <span className="inline-block animate-pulse rounded bg-hover" style={{ width: size, height: size }} />;
}
