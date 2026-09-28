import { z } from 'zod';

/**
 * Una sola llamada por nota de voz (el nivel gratuito cuenta peticiones): Gemini escucha el audio y
 * devuelve la transcripción literal más su lectura. La transcripción es la fuente de verdad; `command`
 * reescribe una orden de registro en la sintaxis de la barra, que interpreta el mismo analizador del texto.
 */
export const VoiceCaptureSchema = z.object({
  transcript: z
    .string()
    .describe('Transcripción literal en español, con puntuación. No resumas, no corrijas ni añadas nada.'),
  title: z
    .string()
    .nullable()
    .describe('Título de 3 a 8 palabras si es una entrada de diario; null si es una orden corta de registro.'),
  mood: z.number().nullable().describe('Ánimo de 1 (muy bajo) a 5 (muy alto) solo si se expresa; si no, null.'),
  tags: z.array(z.string()).describe('De 0 a 5 etiquetas temáticas en minúsculas, sin #.'),
  command: z
    .string()
    .nullable()
    .describe(
      'Si todo el audio es UNA orden de registro, reescrita con cifras en la sintaxis de la barra; si no, null.',
    ),
  detectedActions: z
    .array(
      z.object({
        type: z.enum(['expense', 'workout', 'habit', 'meal', 'media']),
        summary: z.string().describe('Qué se registraría, en una frase corta.'),
        command: z.string().describe('La orden en la sintaxis de la barra, con cifras.'),
      }),
    )
    .describe('Registros mencionados de forma explícita dentro de una entrada de diario. Vacío si no hay.'),
});

export type VoiceCapture = z.infer<typeof VoiceCaptureSchema>;
