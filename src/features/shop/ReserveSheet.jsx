import { useState } from 'react';
import { CC, Icon } from '../../ui';
import { useCreateReservation, useShopConfig } from '../../lib/queries';

const DEFAULT_PAYMENT_INFO = 'Scotiabank\nCaja de ahorro en $\n2504805900\nBruno Incert';
const DEFAULT_PICKUP_INFO = 'Retiro en la sede del club de lunes a viernes de 18:30 a 20:30 hs.';

export function ReserveSheet({ item, player, onClose, toast }) {
  const sizes = (item.sizes || []).filter((s) => s.stock > 0);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0].size : '');
  const [qty, setQty] = useState(1);
  const [contactName, setContactName] = useState(player?.name || '');
  const [contactPhone, setContactPhone] = useState(player?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [done, setDone] = useState(false);

  const createRes = useCreateReservation();
  const configQ = useShopConfig();
  const paymentInfo = configQ.data?.payment_info || DEFAULT_PAYMENT_INFO;
  const pickupInfo = configQ.data?.pickup_info || DEFAULT_PICKUP_INFO;

  const selectedSize = (item.sizes || []).find((s) => s.size === size);
  const maxQty = selectedSize ? selectedSize.stock : 99;

  function submit() {
    if (!size) { toast?.('Elegí un talle'); return; }
    if (!contactName.trim()) { toast?.('Ingresá tu nombre de contacto'); return; }
    createRes.mutate({
      item, playerId: player.id,
      size, quantity: qty,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      paymentMethod,
    }, {
      onSuccess: () => setDone(true),
      onError: () => toast?.('No se pudo crear la reserva'),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.6)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="bag" size={20} color={CC.gold} sw={2.3} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Reservar</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>

        {done ? (
          <div style={{ overflowY: 'auto', padding: '28px 20px', paddingBottom: 'max(28px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(30,158,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={34} color={CC.good} sw={2.4} />
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: CC.ink, letterSpacing: 0.3, textAlign: 'center' }}>¡Reserva enviada!</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.muted, lineHeight: 1.5, textAlign: 'center' }}>
              Reservaste <b>{item.name}</b> talle <b>{size}</b> × {qty}.
            </div>

            {/* datos de pago si eligió transferencia */}
            {paymentMethod === 'transferencia' && (
              <div style={{ alignSelf: 'stretch', background: 'rgba(14,58,92,0.05)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.navy, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Datos para transferencia</div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, color: CC.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{paymentInfo}</div>
              </div>
            )}

            {/* retiro */}
            <div style={{ alignSelf: 'stretch', background: 'rgba(249,178,51,0.10)', border: `1.5px solid ${CC.gold}`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10 }}>
              <Icon name="calendar" size={20} color={CC.goldDeep} sw={2.2} />
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, lineHeight: 1.5 }}>{pickupInfo}</div>
            </div>

            <button onClick={onClose} style={{ alignSelf: 'stretch', border: 'none', background: CC.navy, color: '#fff', padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, marginTop: 4 }}>Listo</button>
          </div>
        ) : (
          <>
            <div style={{ overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* talle */}
              <div>
                <div style={labelStyle}>Talle</div>
                {sizes.length === 0 ? (
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.bad, fontWeight: 600 }}>Sin stock disponible</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(item.sizes || []).map((s) => {
                      const out = !s.stock;
                      const sel = s.size === size;
                      return (
                        <button key={s.size} onClick={() => !out && setSize(s.size)} disabled={out} style={{
                          width: 56, height: 56, borderRadius: 12,
                          border: `2px solid ${sel ? CC.navy : out ? CC.line : 'rgba(14,58,92,0.2)'}`,
                          background: sel ? CC.navy : out ? CC.paper : '#fff',
                          color: sel ? '#fff' : out ? CC.faint : CC.ink,
                          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17,
                          cursor: out ? 'default' : 'pointer', position: 'relative',
                        }}>
                          {s.size}
                          {out && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '80%', height: 1.5, background: CC.faint, transform: 'rotate(-30deg)' }} /></div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* cantidad */}
              <div>
                <div style={labelStyle}>Cantidad</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1.5px solid ${CC.line}`, borderRadius: 12, padding: '8px 12px', background: '#fff', width: 'fit-content' }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={stepBtn}>−</button>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: CC.ink, minWidth: 28, textAlign: 'center' }}>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} style={stepBtn}>+</button>
                </div>
              </div>

              {/* contacto */}
              <div>
                <div style={labelStyle}>Datos de contacto</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nombre completo" style={inputStyle} />
                  <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Celular (ej: 099 123 456)" type="tel" style={inputStyle} />
                </div>
              </div>

              {/* forma de pago */}
              <div>
                <div style={labelStyle}>Forma de pago</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'efectivo', label: 'Efectivo al retirar', sub: 'Pagás cuando retirás el producto' },
                    { id: 'transferencia', label: 'Transferencia bancaria', sub: 'Te mostramos los datos al confirmar' },
                  ].map((pm) => {
                    const sel = paymentMethod === pm.id;
                    return (
                      <button key={pm.id} onClick={() => setPaymentMethod(pm.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        border: `2px solid ${sel ? CC.navy : CC.line}`,
                        borderRadius: 13, background: sel ? 'rgba(14,58,92,0.04)' : '#fff',
                        cursor: 'pointer', textAlign: 'left',
                      }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? CC.navy : CC.faint}`, background: sel ? CC.navy : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink }}>{pm.label}</div>
                          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 1 }}>{pm.sub}</div>
                        </div>
                      </button>
                    );
                  })}

                  {/* datos bancarios inline cuando elige transferencia */}
                  {paymentMethod === 'transferencia' && (
                    <div style={{ background: 'rgba(14,58,92,0.05)', borderRadius: 12, padding: '12px 14px', marginTop: 2 }}>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.navy, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Datos para transferencia</div>
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, color: CC.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{paymentInfo}</div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
              <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
              <button onClick={submit} disabled={createRes.isPending || !size} style={{ flex: 1.6, border: 'none', background: !size ? 'rgba(14,58,92,0.12)' : CC.gold, color: !size ? CC.faint : CC.navy900, padding: '13px', borderRadius: 13, cursor: !size ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="check" size={18} color={!size ? CC.faint : CC.navy900} sw={2.6} />
                {createRes.isPending ? 'Guardando…' : 'Confirmar reserva'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle = { fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', marginBottom: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '11px 12px', fontFamily: 'Barlow, sans-serif', fontSize: 15, color: CC.ink, background: '#fff' };
const stepBtn = { width: 36, height: 36, borderRadius: 9, border: 'none', background: 'rgba(14,58,92,0.07)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: CC.navy, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
