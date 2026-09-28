import { createClient } from '@/lib/supabase/client';
import type { UploadBucket } from '@/modules/quick/types';

const EXTENSION: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
};

/**
 * Sube directo a Storage con la sesión del usuario: el archivo nunca pasa por una función
 * (límites de tamaño del cuerpo). Devuelve la ruta que recibe la Server Action.
 */
export async function uploadToBucket(bucket: UploadBucket, blob: Blob): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new Error('Sin sesión');

  // MediaRecorder etiqueta el audio como «audio/webm;codecs=opus»: Storage compara el tipo sin parámetros.
  const contentType = blob.type.split(';')[0] ?? '';
  const extension = EXTENSION[contentType];
  if (!extension) throw new Error(`Tipo no admitido: ${blob.type}`);

  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType, upsert: false });
  if (error) throw error;
  return path;
}
