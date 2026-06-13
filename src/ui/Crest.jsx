export function Crest({ size = 40 }) {
  return (
    <img
      src="/assets/escudo.png"
      alt="Champagnat"
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  );
}
