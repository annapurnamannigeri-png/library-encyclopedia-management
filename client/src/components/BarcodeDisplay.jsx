import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Download, Printer } from 'lucide-react';

const BarcodeDisplay = ({ value, width = 1.5, height = 40, showText = true, label = "" }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: showText,
          background: '#ffffff', // White background for printable barcodes
          lineColor: '#000000', // Black lines for printable barcodes
          margin: 10
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [value, width, height, showText]);

  const downloadBarcode = () => {
    const svg = barcodeRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `barcode-${value}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const printBarcode = () => {
    const svg = barcodeRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${value}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
            .label { margin-bottom: 10px; font-weight: bold; font-size: 1.2rem; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${label ? `<div class="label">${label}</div>` : ''}
          ${svgData}
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!value) return null;

  return (
    <div className="flex flex-col items-center space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10 group">
      <div className="bg-white p-2 rounded-lg">
        <svg ref={barcodeRef} className="max-w-full"></svg>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={downloadBarcode}
          className="p-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
          title="Download PNG"
        >
          <Download size={16} />
        </button>
        <button 
          onClick={printBarcode}
          className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
          title="Print Label"
        >
          <Printer size={16} />
        </button>
      </div>
    </div>
  );
};

export default BarcodeDisplay;
