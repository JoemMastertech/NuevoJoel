import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Configuración de entorno
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan variables de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}
if (!GOOGLE_API_KEY) {
  console.error('Falta GOOGLE_TRANSLATE_API_KEY en el entorno para realizar traducciones.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Idiomas objetivo (no incluye español base)
const TARGET_LANGUAGES = ['en', 'fr', 'it', 'zh'];

// Corpus base
const HEADINGS = [
  { key: 'drink_options.title', text: '¿Con qué desea acompañar su bebida?', namespace: 'headings' },
  { key: 'drink_options.subtitle_liter', text: 'Cada litro se sirve con 6 oz del destilado que elija.', namespace: 'headings' },
  { key: 'drink_options.subtitle_cup', text: 'Cada copa se sirve con 1 ½ oz del destilado que elija.', namespace: 'headings' },
  { key: 'drink_options.subtitle_special', text: 'Puedes elegir 2 Jarras de jugo ó 5 Refrescos ó 1 Jarra de jugo y 2 Refrescos', namespace: 'headings' },
  { key: 'drink_options.subtitle_only_sodas', text: 'Puedes elegir 5 refrescos', namespace: 'headings' },
  { key: 'drink_options.subtitle_message', text: 'Puedes elegir hasta 5 acompañamientos', namespace: 'headings' }
];

const BUTTONS = [
  { key: 'buttons.accept', text: 'Aceptar', namespace: 'buttons' },
  { key: 'buttons.confirm', text: 'Confirmar', namespace: 'buttons' },
  { key: 'buttons.cancel', text: 'Cancelar', namespace: 'buttons' }
];

const PRODUCTS = [
  { key: 'products.none', text: 'Ninguno', namespace: 'products' },
  { key: 'products.mineral', text: 'Mineral', namespace: 'products' },
  { key: 'products.water', text: 'Agua', namespace: 'products' },
  { key: 'products.coke', text: 'Coca', namespace: 'products' },
  { key: 'products.apple', text: 'Manzana', namespace: 'products' },
  { key: 'products.grapefruit', text: 'Toronja', namespace: 'products' },
  { key: 'products.ginger_ale', text: 'Ginger ale', namespace: 'products' },
  { key: 'products.water_bottle', text: 'Botella de Agua', namespace: 'products' },
  { key: 'products.on_the_rocks', text: 'Rocas', namespace: 'products' },
  { key: 'products.neat', text: 'Derecho', namespace: 'products' },
  { key: 'products.paloma', text: 'Paloma', namespace: 'products' },
  { key: 'products.flag', text: 'Bandera', namespace: 'products' },
  { key: 'products.paris', text: 'Paris', namespace: 'products' },
  { key: 'products.tonic', text: 'Tonic', namespace: 'products' }
];

const ENTRIES = [...HEADINGS, ...BUTTONS, ...PRODUCTS];

async function translateText(text, targetLanguage) {
  const url = 'https://translation.googleapis.com/language/translate/v2';
  const params = new URLSearchParams({
    key: GOOGLE_API_KEY,
    q: text,
    target: targetLanguage,
    source: 'es',
    format: 'text'
  });
  const res = await fetch(`${url}?${params.toString()}`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API error ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json?.data?.translations?.[0]?.translatedText || text;
}

async function upsertTranslation(entry, translatedText, targetLanguage) {
  const payload = {
    text_key: entry.key,
    namespace: entry.namespace || 'general',
    target_language: targetLanguage,
    translated_text: translatedText
  };
  const { error } = await supabase
    .from('translations')
    .upsert(payload, { onConflict: 'text_key,namespace,target_language' });
  if (error) throw error;
}

async function run() {
  console.log('Verificando entorno...');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Supabase Key: ${SUPABASE_KEY ? SUPABASE_KEY.slice(0, 6) + '...' : 'MISSING'}`);
  console.log(`Google API Key: ${GOOGLE_API_KEY ? GOOGLE_API_KEY.slice(0, 6) + '...' : 'MISSING'}`);

  // Health checks
  try {
    const t = await translateText('Prueba de traducción', 'en');
    console.log('HealthCheck Google Translate OK:', t);
  } catch (e) {
    console.error('HealthCheck Google Translate FAILED:', e.message);
  }
  try {
    await upsertTranslation({ key: 'health_check', text: 'Prueba', namespace: 'meta' }, 'OK', 'en');
    console.log('HealthCheck Supabase upsert OK.');
  } catch (e) {
    console.error('HealthCheck Supabase upsert FAILED:', e.message);
  }

  console.log(`Comenzando carga de traducciones para ${TARGET_LANGUAGES.join(', ')}...`);
  let total = 0;
  for (const lang of TARGET_LANGUAGES) {
    console.log(`\nIdioma objetivo: ${lang}`);
    for (const entry of ENTRIES) {
      try {
        const translated = await translateText(entry.text, lang);
        await upsertTranslation(entry, translated, lang);
        total++;
        if (total % 25 === 0) console.log(`Progreso: ${total} traducciones upserted...`);
      } catch (err) {
        console.error(`Error en '${entry.key}' (${lang}):`, err.message);
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }
  console.log(`\nCarga completa. Total de registros upserted: ${total}`);
}

run().catch(err => {
  console.error('Error general en la carga de traducciones:', err);
  process.exit(1);
});