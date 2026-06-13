import { useState } from 'react';
import { CC, Icon } from '../../ui';

function lightArrow(side) {
  return { position: 'absolute', [side]: 8, top: '50%', transform: 'translateY(-50%)', width: 46, height: 46, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
}

// Foto a pantalla completa con navegación entre fotos del producto.
export function ShopLightbox({ photos, start, onClose }) {
  const [i, setI] = useState(start || 0);
  if (!photos || !photos.length) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 380, background: 'rgba(4,12,20,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 'max(18px, env(safe-area-inset-top))', right: 18, width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.14)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}><Icon name="x" size={22} color="#fff" sw={2.4} /></button>
      <img src={photos[i]} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '94vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} />
      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setI((i - 1 + photos.length) % photos.length); }} style={lightArrow('left')}><Icon name="chevron" size={26} color="#fff" sw={2.4} style={{ transform: 'rotate(180deg)' }} /></button>
          <button onClick={(e) => { e.stopPropagation(); setI((i + 1) % photos.length); }} style={lightArrow('right')}><Icon name="chevron" size={26} color="#fff" sw={2.4} /></button>
          <div style={{ position: 'absolute', bottom: 'max(26px, env(safe-area-inset-bottom))', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {photos.map((_, j) => <button key={j} onClick={(e) => { e.stopPropagation(); setI(j); }} style={{ width: j === i ? 22 : 8, height: 8, borderRadius: 999, border: 'none', background: j === i ? CC.gold : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }} />)}
          </div>
        </>
      )}
    </div>
  );
}
