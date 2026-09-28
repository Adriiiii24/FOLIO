import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// La clave de la Gemini API sale de .env.local, igual que en la app. Nunca se imprime.
const env: Record<string, string> = {};
try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match) env[match[1]!] = match[2]!.trim();
  }
} catch {
  // Sin .env.local, el eval falla con un mensaje claro en lugar de aquí.
}

/** Eval de extracción contra los modelos reales: `npm run eval`. Gasta cuota gratuita; no va en la CI. */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./evals/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    include: ['evals/**/*.eval.ts'],
    testTimeout: 600_000,
    env,
  },
});
