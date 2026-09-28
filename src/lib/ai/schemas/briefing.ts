import { z } from 'zod';

export const BRIEFING_MODULES = ['gym', 'vault', 'brain', 'nutrition', 'media', 'routine'] as const;

export const BriefingSchema = z.object({
  headline: z.string().describe('Titular de hasta 90 caracteres. Cifras solo como marcadores {{clave}}.'),
  insights: z
    .array(
      z.object({
        id: z.string().describe('Identificador corto en kebab-case, único en el briefing.'),
        module: z.enum(BRIEFING_MODULES),
        severity: z.enum(['info', 'positive', 'warning']),
        text: z.string().describe('Una o dos frases. Cifras solo como marcadores {{clave}}.'),
        evidence: z.array(z.string()).describe('Claves de métricas que sustentan el hallazgo.'),
        action: z.object({
          kind: z
            .enum(['open', 'log', 'ask'])
            .describe('open: abrir una pestaña · log: prellenar la barra en REGISTRAR · ask: preguntar al chat.'),
          label: z.string().describe('Texto del botón, hasta 24 caracteres, sin cifras.'),
          payload: z.string().describe('Ruta interna (p. ej. /vault) para open; texto para log; pregunta para ask.'),
        }),
      }),
    )
    .describe('Entre 3 y 5 hallazgos, del más al menos importante.'),
  reflection: z.string().nullable().describe('Una pregunta breve para el diario de hoy, o null.'),
});

export type Briefing = z.infer<typeof BriefingSchema>;
