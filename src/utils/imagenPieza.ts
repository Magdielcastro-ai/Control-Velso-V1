// Utilidad para procesar imágenes de piezas/proyectos.
// Comprime la imagen (máx 800px de lado, JPEG q=0.7) y la devuelve
// como data URL, lista para guardarse dentro del jsonb de la cotización.
// Así la imagen viaja sola a proyectos al convertir, sin bucket de Storage.

const MAX_LADO = 800;
const CALIDAD_JPEG = 0.7;

export function procesarImagen(archivo: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_LADO || height > MAX_LADO) {
        const escala = MAX_LADO / Math.max(width, height);
        width = Math.round(width * escala);
        height = Math.round(height * escala);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen'));
        return;
      }
      // Fondo blanco por si la imagen tiene transparencia (mejor en impresión)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', CALIDAD_JPEG));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El archivo no es una imagen válida'));
    };
    img.src = url;
  });
}

// Extrae el primer blob de imagen del portapapeles (Ctrl+V / Cmd+V)
export function imagenDelPortapapeles(e: React.ClipboardEvent | ClipboardEvent): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      return items[i].getAsFile();
    }
  }
  return null;
}
