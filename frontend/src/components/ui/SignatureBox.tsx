import { useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

interface Props {
  label: string;
  onChange: (dataUrl: string) => void;
}

export default function SignatureBox({ label, onChange }: Props) {
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

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-800">{label}</label>
        <button
          type="button"
          onClick={clearSignature}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-red-600 bg-slate-100 px-2.5 py-1 rounded-lg"
        >
          <Eraser size={13} /> Borrar
        </button>
      </div>
      <div className="border-2 border-dashed border-indigo-300 rounded-xl bg-white overflow-hidden touch-none">
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