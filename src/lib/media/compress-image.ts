/**
 * Reescala y recodifica la foto EN EL NAVEGADOR antes de subirla:
 * - pesa poco (una foto de móvil ocupa varios MB),
 * - sale sin metadatos EXIF, geolocalización incluida: el canvas no los copia.
 */
export async function compressImage(file: Blob, { maxEdge = 1600, quality = 0.82 } = {}): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D no disponible');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await canvas.convertToBlob({ type: 'image/webp', quality });
  // Algún navegador no codifica WebP y devuelve PNG: entonces, JPEG.
  return webp.type === 'image/webp' ? webp : canvas.convertToBlob({ type: 'image/jpeg', quality });
}
