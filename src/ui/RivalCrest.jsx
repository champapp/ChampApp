import { rivalCrestSrc } from '../lib/rivalCrests';

// Escudo del equipo rival, si se reconoce su nombre (ver rivalCrests.js).
// No renderiza nada si no hay match, para no dejar un hueco raro.
export function RivalCrest({ rival, size = 24, style }) {
  const src = rivalCrestSrc(rival);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={rival}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, ...style }}
    />
  );
}
