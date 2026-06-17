import { CC, Icon, Empty } from '../../ui';
import { useMyReservations, useShopConfig } from '../../lib/queries';

const STATUS_STYLE = {
  pendiente: { bg: 'rgba(249,178,51,0.15)', color: '#a06a00', label: 'Pendiente' },
  pagado:    { bg: 'rgba(14,58,92,0.10)',   color: CC.navy,    label: 'Pagado' },
  entregado: { bg: 'rgba(30,158,106,0.12)', color: '#147a50',  label: 'Entregado' },
  cancelado: { bg: 'rgba(224,82,78,0.10)',  color: CC.bad,     label: 'Cancelado' },
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function MyOrdersSheet({ player, onClose }) {
  const resQ = useMyReservations(player?.id);
  const configQ = useShopConfig();

  const reservations = resQ.data ?? [];
  const config = configQ.data || {};

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.6)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="bag" size={20} color={CC.gold} sw={2.3} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Mis pedidos</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Historial de reservas</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '14px 16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {resQ.isLoading && <div style={{ textAlign: 'center', padding: 24, fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>}
          {!resQ.isLoading && reservations.length === 0 && (
            <div style={{ padding: '24px 0' }}><Empty t="No tenés pedidos todavía" /></div>
          )}

          {/* info de pago/retiro del club */}
          {(config.payment_info || config.pickup_info) && (
            <div style={{ background: 'rgba(14,58,92,0.05)', borderRadius: 14, padding: '12px 14px', marginBottom: 4 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.navy, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>Datos del club</div>
              {config.payment_info && (
                <div style={{ marginBottom: config.pickup_info ? 8 : 0 }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>Datos de pago</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{config.payment_info}</div>
                </div>
              )}
              {config.pickup_info && (
                <div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 }}>Retiro</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{config.pickup_info}</div>
                </div>
              )}
            </div>
          )}

          {reservations.map((r) => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE.pendiente;
            const itemName = r.shop_items?.name || 'Producto';
            const photo = (r.shop_items?.photos || [])[0];
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${CC.line}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: `1px solid ${CC.line}`, background: CC.paper }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: photo ? `center/cover url(${photo})` : 'rgba(14,58,92,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!photo && <Icon name="bag" size={20} color={CC.faint} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{itemName}</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 1 }}>Talle {r.size} · {r.quantity} u. · {fmtDate(r.created_at)}</div>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: st.bg, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: st.color, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </div>
                </div>
                <div style={{ padding: '10px 14px', display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Forma de pago</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, marginTop: 2 }}>{r.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo al retirar'}</div>
                  </div>
                  {r.contact_phone && (
                    <div>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Contacto</div>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, marginTop: 2 }}>{r.contact_phone}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
