// Notas de voz SINTÉTICAS (TTS gratuito de Gemini) para probar la voz de punta a punta y para el eval.
// Uso, desde la raíz: node evals/scripts/make-voice.mjs (lee GOOGLE_GENERATIVE_AI_API_KEY de .env.local).
import { readFileSync, writeFileSync } from 'node:fs';
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}
const OUT = 'evals/fixtures/voice';
const clips = {
  'diario-con-gasto':
    'Hoy ha sido un día tranquilo. Por la mañana salí a correr y después trabajé en el portfolio. A mediodía me gasté doce euros con cuarenta en el Mercadona. Me siento bastante bien, con energía.',
  'gym-series': 'Press de banca, cuatro series de ocho repeticiones con ochenta kilos.',
  'rutina-habito': 'Hecho: meditar.',
};
function wav(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
for (const [id, text] of Object.entries(clips)) {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent',
    {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GOOGLE_GENERATIVE_AI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Lee con naturalidad, en español de España: ${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      }),
    },
  );
  const json = await res.json();
  const data = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!data) {
    console.log(id, 'ERROR', res.status, JSON.stringify(json.error ?? json).slice(0, 200));
    continue;
  }
  const audio = Buffer.from(data.data, 'base64');
  // La API ya devuelve WAV; solo se envuelve si llega PCM crudo.
  writeFileSync(`${OUT}/${id}.wav`, audio.subarray(0, 4).toString() === 'RIFF' ? audio : wav(audio));
  writeFileSync(`${OUT}/${id}.txt`, text + '\n');
  console.log(id, data.mimeType, (audio.length / 48000).toFixed(1), 's');
}
