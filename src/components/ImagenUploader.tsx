import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, ClipboardPaste, Loader2 } from 'lucide-react';
import { procesarImagen, imagenDelPortapapeles } from '@/utils/imagenPieza';

interface ImagenUploaderProps {
  imagen?: string;
  onChange: (imagen: string | undefined) => void;
  etiqueta?: string;
}

// Uploader compacto: acepta archivo o PEGAR imagen (Ctrl+V / Cmd+V).
// La imagen se comprime y guarda como data URL dentro de la cotización.
export function ImagenUploader({ imagen, onChange, etiqueta = 'Imagen' }: ImagenUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async (archivo: File | Blob | null) => {
    if (!archivo) return;
    setProcesando(true);
    setError(null);
    try {
      const dataUrl = await procesarImagen(archivo);
      onChange(dataUrl);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la imagen');
    } finally {
      setProcesando(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const archivo = imagenDelPortapapeles(e);
    if (archivo) {
      e.preventDefault();
      cargar(archivo);
    }
  };

  if (imagen) {
    return (
      <div className="relative inline-block">
        <img
          src={imagen}
          alt={etiqueta}
          className="max-h-32 max-w-[200px] rounded border border-slate-200 object-contain bg-white"
        />
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
          onClick={() => onChange(undefined)}
          title="Quitar imagen"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          cargar(e.target.files?.[0] || null);
          e.target.value = '';
        }}
      />
      <div
        tabIndex={0}
        onPaste={handlePaste}
        className="flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 cursor-text"
        title="Haz clic y pega una imagen con Ctrl+V"
      >
        {procesando ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Procesando imagen…
          </>
        ) : (
          <>
            <ClipboardPaste className="w-3.5 h-3.5" />
            Pega aquí la imagen (Ctrl+V) o
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs border-slate-300"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="w-3.5 h-3.5 mr-1" />
              Cargar archivo
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
