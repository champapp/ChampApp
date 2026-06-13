import { useState } from 'react';
import { CC, Icon } from '../../ui';

// Carrusel de fotos de un producto (thumbnail de la grilla).
export function ShopGallery({ photos }) {
  const [i, setI] = useState(0);
  const n = photos ? photos.length : 0;

  if (!n) {
    return (
      <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', background: `repeating-linear-gradient(135deg, ${CC.paper}, ${CC.paper} 10px, #e6ebef 10px, #e6ebef 20px)` }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CC.faint }}><Icon name="bag" size={40} /></div>
      </div>
    );
  }

  function go(e, d) { e.stopPropagation(); setI((i + d + n) % n); }

  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', background: `center/cover url(${photos[i]})` }}>
      {n > 1 && (
        <>
          <button onClick={(e) => go(e, -1)} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(7,36,61,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevron" size={16} color="#fff" sw={2.6} style={{ transform: 'rotate(180deg)' }} /></button>
          <button onClick={(e) => go(e, 1)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(7,36,61,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevron" size={16} color="#fff" sw={2.6} /></button>
          <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
            {photos.map((_, j) => <button key={j} onClick={(e) => { e.stopPropagation(); setI(j); }} style={{ width: j === i ? 18 : 7, height: 7, borderRadius: 999, border: 'none', background: j === i ? CC.gold : 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0, transition: 'width .2s' }} />)}
          </div>
        </>
      )}
    </div>
  );
}
