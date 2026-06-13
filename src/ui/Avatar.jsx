import { CC } from './tokens';

export function Avatar({ name, photo, size = 44, ring }) {
  const initials = (name || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: photo ? `url(${photo}) center/cover no-repeat` : `linear-gradient(150deg, ${CC.navy700}, ${CC.navy})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
        fontSize: size * 0.4, letterSpacing: 0.5,
        boxShadow: ring ? `0 0 0 2.5px ${ring}` : 'none',
      }}
    >
      {!photo && initials}
    </div>
  );
}
