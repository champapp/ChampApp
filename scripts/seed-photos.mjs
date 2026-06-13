// Seed de fotos: sube assets/fotos/*.jpg (de design_handoff_champ_app) al
// bucket "player-photos" y enlaza cada jugador con sus fotos:
//  - <base>-perfil.jpg  -> players.photo_url
//  - <base>-frente.jpg / <base>-espalda.jpg -> filas en player_photos
//
// La lista LIST es la misma de champ-photos.js (apellido normalizado + categoría).
// Idempotente: usa upsert en Storage y evita duplicar filas en player_photos.
//
// Uso: npm run seed:photos

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv } from './_env.mjs';

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en scripts/.env');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fotosDir = path.join(__dirname, '..', '..', 'design_handoff_champ_app', 'assets', 'fotos');

const PHOTO_DATE = '2026-02-15';

// Misma lista que champ-photos.js: apellido normalizado del plantel + categoría (desambiguar)
const LIST = [
  { base: 'bairo', ap: 'bairo', cat: 'M17' },
  { base: 'barlocci', ap: 'barlocci', cat: 'M17' },
  { base: 'beisso', ap: 'beisso', cat: 'M17' },
  { base: 'bidondo', ap: 'bidondo', cat: 'M17' },
  { base: 'britos', ap: 'britos', cat: 'M17' },
  { base: 'casavalle', ap: 'casavalle', cat: 'M17' },
  { base: 'cayssials', ap: 'cayssials', cat: 'M17' },
  { base: 'correa', ap: 'correa', cat: 'M17' },
  { base: 'costante', ap: 'costante', cat: 'M17' },
  { base: 'dhalewyn', ap: 'dhalewyn', cat: 'M17' },
  { base: 'dasilveira', ap: 'dasilveira', cat: 'M17' },
  { base: 'echeveste', ap: 'echeveste', cat: 'M17' },
  { base: 'guena', ap: 'guena', cat: 'M17' },
  { base: 'lanzarini', ap: 'lanzarini', cat: 'M17' },
  { base: 'macellaro', ap: 'macellaro', cat: 'M17' },
  { base: 'navas', ap: 'navas', cat: 'M17' },
  { base: 'nunes', ap: 'nunes', cat: 'M17' },
  { base: 'ojeda', ap: 'ojeda', cat: 'M13' },
  { base: 'olivera', ap: 'olivera', cat: 'M17' },
  { base: 'parada', ap: 'parada', cat: 'M17' },
  { base: 'parodi', ap: 'parodi', cat: 'M17' },
  { base: 'sanmillan', ap: 'sanmillan', cat: 'M17' },
  { base: 'sciarra', ap: 'sciarra', cat: 'M17' },
  { base: 'soto', ap: 'soto', cat: 'M17' },
  { base: 'tagliabue', ap: 'tagliabue', cat: 'M17' },
];

function norm(s) {
  return String(s || '').normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z]/g, '');
}

let linked = 0, skipped = 0, uploaded = 0;

for (const e of LIST) {
  const { data: candidates, error: selErr } = await supabase
    .from('players')
    .select('id, apellido, photo_url')
    .eq('cat', e.cat);
  if (selErr) throw selErr;

  const player = candidates.find((p) => norm(p.apellido) === e.ap);
  if (!player) {
    console.log(`(sin match) ${e.cat} / ${e.ap}`);
    skipped++;
    continue;
  }

  const variants = [
    { suffix: 'perfil', label: null },
    { suffix: 'frente', label: 'Frente' },
    { suffix: 'espalda', label: 'Espalda' },
  ];

  let profileUrl = player.photo_url;

  for (const v of variants) {
    const filename = `${e.base}-${v.suffix}.jpg`;
    const localPath = path.join(fotosDir, filename);
    const storagePath = `${player.id}/${filename}`;

    const fileBuffer = readFileSync(localPath);
    const { error: upErr } = await supabase.storage
      .from('player-photos')
      .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });
    if (upErr) throw upErr;
    uploaded++;

    const { data: pub } = supabase.storage.from('player-photos').getPublicUrl(storagePath);
    const publicUrl = pub.publicUrl;

    if (v.suffix === 'perfil') {
      profileUrl = publicUrl;
    } else {
      const { data: existing, error: existErr } = await supabase
        .from('player_photos')
        .select('id')
        .eq('player_id', player.id)
        .eq('label', v.label)
        .eq('date', PHOTO_DATE)
        .limit(1);
      if (existErr) throw existErr;
      if (!existing.length) {
        const { error: insErr } = await supabase
          .from('player_photos')
          .insert({ player_id: player.id, date: PHOTO_DATE, label: v.label, image_url: publicUrl });
        if (insErr) throw insErr;
      }
    }
  }

  if (profileUrl !== player.photo_url) {
    const { error: updErr } = await supabase
      .from('players')
      .update({ photo_url: profileUrl })
      .eq('id', player.id);
    if (updErr) throw updErr;
  }

  linked++;
}

console.log(`Jugadores con fotos enlazadas: ${linked}, sin match: ${skipped}, archivos subidos: ${uploaded}`);
console.log('Listo.');
