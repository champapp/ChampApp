// Crea o actualiza la cuenta de administrador. El admin entra con el mismo
// mecanismo que los jugadores: usuario + PIN de 4 dígitos (ver
// src/lib/localAuth.js para la transformación a email/contraseña reales de
// Supabase Auth).
//
// Si ya existe una fila con role='admin' en user_roles, se actualiza el
// email/contraseña de esa cuenta (cambio de credenciales). Si no existe
// ninguna, se crea una cuenta nueva. Si existe más de una, se aborta para
// que el ajuste se haga a mano desde el dashboard de Supabase.
//
// Uso: npm run create:admin -- <usuario> <pin de 4 dígitos>
// Ejemplo: npm run create:admin -- c.champagnat 1975

import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './_env.mjs';
import { usernameToEmail, pinToPassword } from '../src/lib/localAuth.js';

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en scripts/.env');
}

const USERNAME = process.argv[2];
const PIN = process.argv[3];
if (!USERNAME || !/^\d{4}$/.test(PIN ?? '')) {
  throw new Error('Uso: npm run create:admin -- <usuario> <pin de 4 dígitos>');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = usernameToEmail(USERNAME.trim().toLowerCase());
const password = pinToPassword(PIN);

const { data: adminRows, error: adminErr } = await supabase
  .from('user_roles')
  .select('user_id')
  .eq('role', 'admin');
if (adminErr) throw adminErr;

if (adminRows.length > 1) {
  throw new Error(
    `Hay ${adminRows.length} cuentas con role='admin'. Ajustá las credenciales a mano desde el dashboard de Supabase.`
  );
}

let userId;

if (adminRows.length === 1) {
  userId = adminRows[0].user_id;
  const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
    email,
    password,
    email_confirm: true,
  });
  if (updErr) throw updErr;
  console.log(`Credenciales actualizadas para la cuenta admin existente (usuario: ${USERNAME}).`);
} else {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: USERNAME, role: 'admin' },
  });
  if (createErr) throw createErr;
  userId = created.user.id;
  console.log(`Cuenta admin creada (usuario: ${USERNAME}).`);
}

const { error: roleErr } = await supabase
  .from('user_roles')
  .upsert({ user_id: userId, role: 'admin', player_id: null }, { onConflict: 'user_id' });
if (roleErr) throw roleErr;

console.log('Rol admin asignado en user_roles.');
console.log('Listo.');
