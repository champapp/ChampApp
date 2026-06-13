import { useEffect, useRef } from 'react';
import { CC } from './tokens';

// Control segmentado (tabs deslizables), portado de champ-ui.jsx.
export function Segmented({ options, value, onChange, small, center }) {
  const wrapRef = useRef(null);
  const btnRefs = useRef({});

  // Mantener la opción activa centrada (deslizable)
  useEffect(() => {
    const centerNow = (smooth) => {
      const w = wrapRef.current, b = btnRefs.current[value];
      if (!w || !b || w.scrollWidth <= w.clientWidth) return;
      const target = Math.max(0, b.offsetLeft - (w.clientWidth - b.offsetWidth) / 2);
      try { w.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' }); } catch { w.scrollLeft = target; }
    };
    centerNow(false);
    const t = setTimeout(() => centerNow(true), 250);
    return () => clearTimeout(t);
  }, [value, options.length]);

  return (
    <div
      ref={wrapRef}
      style={{
        display: 'flex', gap: 3, padding: 3, background: 'rgba(14,58,92,0.07)',
        borderRadius: 11, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}
    >
      {center && <div style={{ flex: '0 0 38%' }} />}
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            ref={(el) => { btnRefs.current[o.id] = el; }}
            onClick={() => onChange(o.id)}
            style={{
              flex: '1 0 auto', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              padding: small ? '6px 12px' : '8px 14px', borderRadius: 9,
              background: active ? CC.navy : 'transparent',
              color: active ? '#fff' : CC.muted,
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
              fontSize: small ? 15 : 16, letterSpacing: 0.3,
              boxShadow: active ? '0 2px 6px rgba(14,58,92,0.25)' : 'none',
              transition: 'all .15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
      {center && <div style={{ flex: '0 0 38%' }} />}
    </div>
  );
}
