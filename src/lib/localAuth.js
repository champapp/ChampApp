// Login simplificado (jugadores y administradores): la persona solo ve/escribe
// un usuario y un código de 4 dígitos (PIN). Por debajo, Supabase Auth exige
// emails reales y contraseñas de 6+ caracteres, así que armamos un email
// sintético y completamos el código con un sufijo fijo antes de enviarlo.
// Esta misma transformación se usa en scripts/seed-players.mjs,
// scripts/create-admin.mjs y en el login (AuthContext).
const PIN_SUFFIX = '-champ';

export function usernameToEmail(username) {
  return `${username}@champapp.local`;
}

export function pinToPassword(pin) {
  return `${pin}${PIN_SUFFIX}`;
}
