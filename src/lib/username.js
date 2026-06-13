// Generación de usernames de jugadores: primera letra del nombre + "." + apellido,
// en minúsculas y sin tildes (misma regla que champ-data.js del prototipo).
// Ej: "Bruno Incerti" -> "b.incerti".
//
// Si ese username ya está tomado, se agregan más letras del nombre antes de
// probar de nuevo: "b.incerti" -> "br.incerti" -> "bru.incerti" -> ...
// Como último recurso (nombre y apellido exactamente iguales a otro jugador),
// se agrega un sufijo numérico al final.

export function slug(s) {
  return String(s || '').normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z]/g, '');
}

export function usernameCandidates(nombre, apellido) {
  const firstLetters = slug(nombre) || 'x';
  const lastPart = slug(String(apellido || '').trim().split(/\s+/).pop());
  const candidates = [];
  for (let len = 1; len <= firstLetters.length; len++) {
    candidates.push(firstLetters.slice(0, len) + '.' + lastPart);
  }
  return candidates;
}

export function pickUsername(nombre, apellido, taken) {
  const candidates = usernameCandidates(nombre, apellido);
  for (const c of candidates) {
    if (!taken.has(c)) return c;
  }
  let base = candidates[candidates.length - 1];
  let n = 2, u = base + n;
  while (taken.has(u)) { n++; u = base + n; }
  return u;
}
