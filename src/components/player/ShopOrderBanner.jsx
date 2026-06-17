import { CC, Icon } from '../../ui';
import { useMyReservations, useShopConfig } from '../../lib/queries';

const STATUS = {
  pendiente: { label: 'Pendiente de pago', color: '#a06a00', bg: 'rgba(249,178,51,0.18)' },
  pagado:    { label: 'Pagado · listo para retirar', color: CC.navy, bg: 'rgba(14,58,92,0.10)' },
};

const DEFAULT_PICKUP = 'Retiro en la sede del club de lunes a viernes de 18:30 a 20:30 hs.';
const DEFAULT_PAYMENT = 'Scotiabank · Caja de ahorro en $ · 2504805900 · Bruno Incert';

export function ShopOrderBanner({ playerId, pad = true }) {
  const resQ = useMyReservations(playerId);
  const configQ = useShopConfig();

  const active = (resQ.data ?? []).filter((r) => r.status === 'pendiente' || r.status === 'pagado');
  if (!active.length) return null;

  const pickupInfo = configQ.data?.pickup_info || DEFAULT_PICKUP;
  const paymentInfo = configQ.data?.payment_info || DEFAULT_PAYMENT;

  return (
    <div style={{ padding: pad ? '16px 16px 0' : 0 }}>
      {active.map((r) => {
        const st = STATUS[r.status];
        const itemName = r.shop_items?.name || 'Producto';
        const photo = (r.shop_items?.photos || [])[0];
        const isPagado = r.status === 'pagado';

        return (
          <div key={r.id} style={{ background: 'linear-gradient(150deg, #FFF6E4, #FDEFD0)', border: `1.5px solid ${CC.gold}`, borderRadius: 16, padding: '13px 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              {/* ícono / foto */}
              <div style={{ width: 38, height: 38, borderRadius: 10, background: photo ? `center/cover url(${photo})` : CC.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {!photo && <Icon name="bag" size={20} color={CC.navy900} sw={2.3} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* producto + chip de estado */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.navy900, lineHeight: 1.1, flex: 1 }}>
                    {itemName}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 999, background: st.bg, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, color: st.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {st.label}
                  </div>
                </div>

                {/* detalle de la compra */}
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: '#6b4e1e', marginTop: 4, lineHeight: 1.4 }}>
                  Talle <b>{r.size}</b> · {r.quantity} unidad{r.quantity !== 1 ? 'es' : ''} · {r.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo al retirar'}
                </div>

                {/* datos de transferencia si aplica y sigue pendiente */}
                {r.status === 'pendiente' && r.payment_method === 'transferencia' && (
                  <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 9, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: '#9a7a3c', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>Datos para transferencia</div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: CC.navy900, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{paymentInfo}</div>
                  </div>
                )}

                {/* info de retiro cuando ya está pagado */}
                {isPagado && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <Icon name="calendar" size={14} color={CC.goldDeep} sw={2.2} />
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: '#6b4e1e', lineHeight: 1.4 }}>{pickupInfo}</div>
                  </div>
                )}

                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: '#9a7a3c', fontWeight: 600, letterSpacing: 0.3, marginTop: 6, textTransform: 'uppercase' }}>
                  Reserva Champa Shop
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
