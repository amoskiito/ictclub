import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrImage({ text, size = 240, label }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, { width: size * 2, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => alive && setSrc(url))
      .catch(() => {});
    return () => { alive = false; };
  }, [text, size]);
  return src
    ? <img className="qr" src={src} width={size} height={size} alt={label || "QR code"} />
    : <div className="qr qr-loading" style={{ width: size, height: size }} />;
}
