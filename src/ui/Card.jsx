import { CC } from './tokens';

// Tarjeta base, portada de champ-ui.jsx.
export function Card({ children, style, pad = 16, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: CC.card,
        borderRadius: 20,
        padding: pad,
        boxShadow: '0 1px 2px rgba(14,34,53,0.04), 0 6px 20px rgba(14,34,53,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
