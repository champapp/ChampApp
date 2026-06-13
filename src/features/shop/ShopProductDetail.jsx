import { useState } from 'react';
import { CC, Icon } from '../../ui';
import { shopCatOf, shopTotalStock } from '../../lib/domain';
import { useSellShopItem, useRestockShopItem } from '../../lib/queries';
import { ShopLightbox } from './ShopLightbox';

// Ficha de un producto: foto grande, descripción, talles y stock.
// En modo admin permite vender (descontar stock) y reponer.
export function ShopProductDetail({ item, editing, onEdit, onClose, toast }) {
  const [bigStart, setBigStart] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const sell = useSellShopItem();
  const restock = useRestockShopItem();

  const photos = item.photos || [];
  const totalStock = shopTotalStock(item);

  function doSell(sz) {
    sell.mutate({ item, size: sz, qty: 1 }, { onSuccess: () => toast?.('Venta registrada · ' + sz) });
  }
  function doRestock(sz) {
    restock.mutate({ item, size: sz, qty: 1 });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 330, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.6)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(7,36,61,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color="#fff" sw={2.5} /></button>

        <div style={{ overflowY: 'auto' }}>
          <div style={{ position: 'relative' }}>
            {photos.length ? (
              <div onClick={() => setBigStart(photoIdx)} style={{ width: '100%', paddingBottom: '82%', position: 'relative', background: `center/cover url(${photos[photoIdx]})`, cursor: 'zoom-in', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(7,36,61,0.6)', borderRadius: 999, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="search" size={13} color="#fff" sw={2.3} /><span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: '#fff' }}>Ampliar</span></div>
              </div>
            ) : (
              <div style={{ width: '100%', paddingBottom: '70%', position: 'relative', background: `repeating-linear-gradient(135deg, ${CC.paper}, ${CC.paper} 10px, #e6ebef 10px, #e6ebef 20px)` }}><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CC.faint }}><Icon name="bag" size={46} /></div></div>
            )}
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px 0', overflowX: 'auto' }}>
                {photos.map((ph, j) => (
                  <button key={j} onClick={() => setPhotoIdx(j)} style={{ flexShrink: 0, width: 54, height: 54, borderRadius: 10, border: `2px solid ${j === photoIdx ? CC.gold : 'transparent'}`, background: `center/cover url(${ph})`, cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '14px 16px 0' }}>
            <div style={{ display: 'inline-block', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 0.6, color: CC.navy, background: 'rgba(14,58,92,0.08)', borderRadius: 999, padding: '3px 10px', textTransform: 'uppercase', marginBottom: 7 }}>{shopCatOf(item)}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 25, color: CC.ink, lineHeight: 1.02, letterSpacing: 0.2 }}>{item.name}</div>
              {item.price != null && <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 25, color: CC.goldDeep, whiteSpace: 'nowrap' }}>${item.price}</div>}
            </div>
            {item.descr && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.muted, marginTop: 6, lineHeight: 1.4 }}>{item.descr}</div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14, marginBottom: 8 }}>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>Talles y stock</span>
              <div style={{ flex: 1, height: 1, background: CC.line }} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: totalStock ? CC.good : CC.bad }}>{totalStock ? totalStock + ' disponibles' : 'Sin stock'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(item.sizes || []).map((s, i) => {
                const out = !s.stock;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, border: `1.5px solid ${out ? CC.line : 'rgba(14,58,92,0.16)'}`, borderRadius: 12, padding: '9px 12px', background: out ? CC.paper : '#fff' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: out ? 'rgba(14,58,92,0.05)' : CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: out ? CC.faint : '#fff', letterSpacing: 0.3 }}>{s.size}</span></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink, lineHeight: 1 }}>{out ? 'Agotado' : s.stock + ' unidad' + (s.stock === 1 ? '' : 'es')}</div>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: out ? CC.bad : CC.good, fontWeight: 600, marginTop: 2 }}>{out ? 'sin disponibilidad' : 'disponible'}</div>
                    </div>
                    {editing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => doRestock(s.size)} title="Sumar stock" style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={16} color={CC.navy} sw={2.5} /></button>
                        <button onClick={() => doSell(s.size)} disabled={out} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: out ? 'rgba(14,58,92,0.08)' : CC.gold, color: out ? CC.faint : CC.navy900, borderRadius: 9, padding: '8px 13px', cursor: out ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}><Icon name="bag" size={14} color={out ? CC.faint : CC.navy900} sw={2.3} />Vender</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {editing && item.sold > 0 && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 10, textAlign: 'center' }}>{item.sold} unidad{item.sold === 1 ? '' : 'es'} vendida{item.sold === 1 ? '' : 's'} en total</div>}
          </div>
        </div>

        {editing && (
          <div style={{ padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
            <button onClick={onEdit} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1.5px solid ${CC.navy}`, background: 'rgba(14,58,92,0.03)', color: CC.navy, borderRadius: 13, padding: '12px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16 }}><Icon name="edit" size={16} color={CC.navy} sw={2.3} />Editar producto</button>
          </div>
        )}
      </div>
      {bigStart != null && <ShopLightbox photos={photos} start={bigStart} onClose={() => setBigStart(null)} />}
    </div>
  );
}
