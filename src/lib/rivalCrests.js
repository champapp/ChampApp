// Escudos de los rivales del Top 12 uruguayo (más Champagnat, ya en /assets).
// El nombre del rival lo carga el admin a mano y no sigue un formato fijo
// (siglas, typos, encuentros con varios equipos a la vez), así que el
// reconocimiento es por substring, no por igualdad exacta con el nombre.
const RIVAL_CRESTS = [
  { tokens: ['obc', 'old boys'], src: '/assets/rivals/old-boys.svg' },
  { tokens: ['occ', 'old christians'], src: '/assets/rivals/old-christians.png' },
  { tokens: ['trebol'], src: '/assets/rivals/trebol.jpg' },
  { tokens: ['carrasco polo', 'cpc'], src: '/assets/rivals/carrasco-polo.svg' },
  { tokens: ['los cuervos', 'cuervos', 'cuevos', 'cgu'], src: '/assets/rivals/los-cuervos.jpg' },
  { tokens: ['mvcc', 'montevideo cricket'], src: '/assets/rivals/mvcc.jpg' },
  { tokens: ['seminario'], src: '/assets/rivals/seminario.png' },
  { tokens: ['psg'], src: '/assets/rivals/psg.png' },
  { tokens: ['lobos'], src: '/assets/rivals/lobos.png' },
  { tokens: ['ceibos'], src: '/assets/rivals/ceibos.jpg' },
  { tokens: ['ctm', 'circulo de tenis'], src: '/assets/rivals/ctm.png' },
];

const ACCENTS = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' };

function normalize(s) {
  return (s || '').toLowerCase().replace(/[áéíóúñ]/g, (c) => ACCENTS[c]);
}

// URL del escudo de un rival a partir de su nombre en texto libre, o null
// si no se reconoce (partidos amistosos, encuentros de menores, etc.).
export function rivalCrestSrc(rivalName) {
  const norm = normalize(rivalName);
  if (!norm) return null;
  const team = RIVAL_CRESTS.find((t) => t.tokens.some((tok) => norm.includes(tok)));
  return team ? team.src : null;
}
