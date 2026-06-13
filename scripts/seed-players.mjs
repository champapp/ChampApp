// Seed de jugadores: lee el plantel real de design_handoff_champ_app/champ-roster.js,
// genera los usernames (inicial del nombre + "." + apellido, normalizado; ver
// src/lib/username.js para la regla de desambiguación), y para cada jugador:
//  - inserta/actualiza su fila en `players` (nombre, apellido, cat, sub, birth_year)
//  - crea su cuenta de Supabase Auth (<username>@champapp.local / PIN+sufijo)
//  - crea/actualiza su fila en `user_roles` (role='player')
//
// Idempotente: se puede volver a correr sin duplicar nada.
//
// Uso: npm run seed:players

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv } from './_env.mjs';
import { usernameToEmail, pinToPassword } from '../src/lib/localAuth.js';
import { pickUsername } from '../src/lib/username.js';

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en scripts/.env');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PIN = '2026';

// ---- Cargar window.CHAMP_ROSTER = {...}; ----
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rosterPath = path.join(__dirname, '..', '..', 'design_handoff_champ_app', 'champ-roster.js');
const rosterRaw = readFileSync(rosterPath, 'utf-8');
const ROSTER = JSON.parse(rosterRaw.slice(rosterRaw.indexOf('{'), rosterRaw.lastIndexOf('}') + 1));

// ---- Armar lista de jugadores reales (sin asistencia ni datos físicos) ----
const players = [];
for (const key of Object.keys(ROSTER)) {
  const grp = ROSTER[key];
  for (const rp of grp.players) {
    players.push({
      nombre: rp.nombre,
      apellido: rp.apellido,
      cat: grp.cat,
      sub: grp.sub,
      birth_year: rp.year,
    });
  }
}

const userSeen = new Set();
for (const p of players) {
  p.username = pickUsername(p.nombre, p.apellido, userSeen);
  userSeen.add(p.username);
}

console.log(`Plantel a importar: ${players.length} jugadores`);

// ---- Mapa de cuentas de Auth existentes (para no recrearlas en re-corridas) ----
const emailToAuthId = new Map();
{
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) emailToAuthId.set(u.email, u.id);
    if (data.users.length < 1000) break;
    page++;
  }
}

// ---- Insertar/actualizar en Supabase ----
let inserted = 0, updated = 0, authCreated = 0, authLinked = 0, roleRows = 0;

for (const p of players) {
  const { data: existingRows, error: selErr } = await supabase
    .from('players')
    .select('id, auth_user_id')
    .eq('username', p.username)
    .limit(1);
  if (selErr) throw selErr;

  let playerId;
  let authUserId = existingRows?.[0]?.auth_user_id ?? null;

  if (existingRows && existingRows.length) {
    playerId = existingRows[0].id;
    const { error: updErr } = await supabase
      .from('players')
      .update({
        nombre: p.nombre,
        apellido: p.apellido,
        cat: p.cat,
        sub: p.sub,
        birth_year: p.birth_year,
      })
      .eq('id', playerId);
    if (updErr) throw updErr;
    updated++;
  } else {
    const { data: insRow, error: insErr } = await supabase
      .from('players')
      .insert({
        nombre: p.nombre,
        apellido: p.apellido,
        cat: p.cat,
        sub: p.sub,
        birth_year: p.birth_year,
        username: p.username,
      })
      .select('id')
      .single();
    if (insErr) throw insErr;
    playerId = insRow.id;
    inserted++;
  }

  // Cuenta de Auth (username@champapp.local / PIN+sufijo)
  if (!authUserId) {
    const email = usernameToEmail(p.username);
    authUserId = emailToAuthId.get(email) ?? null;

    if (!authUserId) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: pinToPassword(DEFAULT_PIN),
        email_confirm: true,
        user_metadata: { username: p.username, nombre: p.nombre, apellido: p.apellido },
      });
      if (createErr) throw createErr;
      authUserId = created.user.id;
      emailToAuthId.set(email, authUserId);
      authCreated++;
    }

    const { error: linkErr } = await supabase
      .from('players')
      .update({ auth_user_id: authUserId })
      .eq('id', playerId);
    if (linkErr) throw linkErr;
    authLinked++;
  }

  // user_roles
  const { error: roleErr } = await supabase
    .from('user_roles')
    .upsert({ user_id: authUserId, role: 'player', player_id: playerId }, { onConflict: 'user_id' });
  if (roleErr) throw roleErr;
  roleRows++;
}

console.log(`Jugadores nuevos: ${inserted}, actualizados: ${updated}`);
console.log(`Cuentas Auth creadas/linkeadas: ${authCreated} nuevas, ${authLinked} enlazadas`);
console.log(`Filas user_roles: ${roleRows}`);
console.log('PIN inicial para todos:', DEFAULT_PIN);
console.log('Listo.');
