import { useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

interface Props {
  label: string;
  onChange: (dataUrl: string) => void;
  readOnly?: boolean;
  value?: string;
}

export default function SignatureBox({ label, onChange, readOnly = false, value = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current && hasSigned) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onChange('');
  };

  if (readOnly) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold tracking-tight text-slate-800">{label}</label>
        <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-[#f8f9fc] p-3">
          {value ? (
            <img src={value} alt="Firma registrada" className="h-32 max-w-full object-contain" />
          ) : (
            <span className="text-xs italic text-slate-500">Sin firma registrada</span>
          )}
        </div>
        <p className="text-[11px] text-slate-500">La firma original no se puede modificar desde Secretaría.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold tracking-tight text-slate-800">{label}</label>
        <button
          type="button"
          onClick={clearSignature}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 px-2.5 py-1 rounded-lg transition-all duration-150 active:scale-[0.98]"
        >
          <Eraser size={12} /> Borrar
        </button>
      </div>
      <div className="border border-dashed border-[#01317b]/35 rounded-xl bg-white shadow-inner overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
          className="w-full h-36 cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
}
