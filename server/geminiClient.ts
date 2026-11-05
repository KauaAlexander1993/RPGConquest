import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[Chronicles RPG API] AVISO: GEMINI_API_KEY não foi detectada nas variáveis de ambiente. Verifique o painel Secrets.');
}

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const RPG_MODEL = 'gemini-3.8-flash';
