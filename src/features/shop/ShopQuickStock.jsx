import { CC, Icon, Empty } from '../../ui';
import { useSellShopItem, useRestockShopItem } from '../../lib/queries';

// Venta rápida: lista todos los productos con − (vender) y + (reponer)
// por talle, para movimientos de stock al instante.
export function ShopQuickStock({ items, onClose, toast }) {
  const sell = useSellShopItem();
  const restock = useRestockShopItem();

  function doSell(item, sz) {
    sell.mutate({ item, size: sz, qty: 1 }, { onSuccess: () => toast?.('Venta · ' + sz) });
  }
  function doRestock(item, sz) {
    restock.mutate({ item, size: sz, qty: 1 });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 330, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.6)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bag" size={20} color={CC.navy900} sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Venta rápida</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Tocá − por cada venta · + para reponer</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '12px 14px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 && <Empty t="No hay productos cargados" />}
          {items.map((it) => {
            const total = (it.sizes || []).reduce((a, s) => a + (s.stock || 0), 0);
            return (
              <div key={it.id} style={{ border: `1px solid ${CC.line}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', background: CC.paper, borderBottom: `1px solid ${CC.line}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: (it.photos && it.photos[0]) ? `center/cover url(${it.photos[0]})` : 'rgba(14,58,92,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{!(it.photos && it.photos[0]) && <Icon name="bag" size={20} color={CC.faint} />}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 1 }}>{total} en stock{it.sold ? ' · ' + it.sold + ' vendidas' : ''}</div>
                  </div>
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(it.sizes || []).length === 0 && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.faint }}>Sin talles cargados</div>}
                  {(it.sizes || []).map((s, i) => {
                    const out = !s.stock;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 38, borderRadius: 9, background: out ? 'rgba(14,58,92,0.05)' : CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: out ? CC.faint : '#fff', letterSpacing: 0.3 }}>{s.size}</span></div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 5 }}>
                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: out ? CC.bad : CC.ink, lineHeight: 1 }}>{s.stock || 0}</span>
                          <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, fontWeight: 600 }}>{out ? 'agotado' : 'unidades'}</span>
                        </div>
                        <button onClick={() => doSell(it, s.size)} disabled={out} style={{ width: 48, height: 44, borderRadius: 12, border: 'none', background: out ? 'rgba(224,82,78,0.12)' : CC.bad, cursor: out ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: out ? 'rgba(224,82,78,0.5)' : '#fff', lineHeight: 1 }}>−</span>
                        </button>
                        <button onClick={() => doRestock(it, s.size)} style={{ width: 48, height: 44, borderRadius: 12, border: 'none', background: CC.good, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: '#fff', lineHeight: 1 }}>+</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
