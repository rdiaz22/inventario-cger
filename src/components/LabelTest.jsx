import React from 'react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

const variants = [
  { format: 'CODE128', xdim: 0.25, quiet: 1.2, label: 'C128 x0.25 q1.2' },
  { format: 'CODE128', xdim: 0.30, quiet: 1.5, label: 'C128 x0.30 q1.5' },
  { format: 'CODE128', xdim: 0.33, quiet: 2.0, label: 'C128 x0.33 q2.0' },
  { format: 'CODE39',  xdim: 0.30, quiet: 1.5, label: 'C39 x0.30 q1.5' },
  { format: 'CODE39',  xdim: 0.35, quiet: 2.0, label: 'C39 x0.35 q2.0' },
];

const LabelTest = () => {
  const printSheet = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });
    const dpi = 600;
    const pxPerMm = dpi / 25.4;

    variants.forEach((v, i) => {
      const canvas = document.createElement('canvas');
      const widthPx = Math.round(24 * pxPerMm);
      const heightPx = Math.round(12 * pxPerMm * 0.85);
      canvas.width = widthPx;
      canvas.height = heightPx;

      JsBarcode(canvas, 'ZSYX00KJ', {
        format: v.format,
        displayValue: false,
        background: '#ffffff',
        lineColor: '#000000',
        margin: Math.round(v.quiet * pxPerMm),
        height: heightPx,
        width: Math.max(3, Math.round(v.xdim * pxPerMm)),
      });

      const y = 8 + i * 10;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 5, y, 24, 8);
      pdf.setFontSize(8);
      pdf.text(v.label, 35, y + 6);
    });

    pdf.save('label-test.pdf');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Pruebas de etiquetas 24×12 mm</h2>
      <p className="text-sm text-gray-600 mb-4">Imprime una hoja con varias variantes (x-dim y quiet zone) para probar cuál lee mejor tu móvil.</p>
      <button onClick={printSheet} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Imprimir hoja de prueba</button>
    </div>
  );
};

export default LabelTest;


