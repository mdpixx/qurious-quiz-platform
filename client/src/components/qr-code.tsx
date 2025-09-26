import { useEffect, useRef } from "react";
import { generateQR } from "@/lib/qr-generator";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 200, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      generateQR(value, canvasRef.current, size);
    }
  }, [value, size]);

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="border rounded-lg"
        data-testid="qr-code"
      />
    </div>
  );
}
