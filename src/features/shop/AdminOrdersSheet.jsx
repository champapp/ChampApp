import { useState } from 'react';
import { CC, Icon, Chip, Empty } from '../../ui';
import { useReservations, useShopItems, useUpdateReservationStatus, useDeliverReservation, useCancelReservation, useShopConfig, useUpsertShopConfig } from '../../lib/queries';

const STATUS_STYLE = {
  pendiente: { bg: 'rgba(249,178,51,0.15)', color: '#a06a00', label: 'Pendiente' },
  pagado:    { bg: 'rgba(14,58,92,0.10)',   color: CC.navy,    label: 'Pagado' },
  entregado: { bg: 'rgba(30,158,106,0.12)', color: '#147a50',  label: 'Entregado' },
  cancelado: { bg: 'rgba(224,82,78,0.10)',  color: CC.bad,     label: 'Cancelado' },
};

const STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'pagado', label: 'Pagado' },
  { id: 'entregado', label: 'Entregado' },
  { id: 'cancelado', label: 'Cancelado' },
];

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function ConfigSection({ toast }) {
  const configQ = useShopConfig();
  const upsert = useUpsertShopConfig();
  const [editing, setEditing] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState('');
  const [pickupInfo, setPickupInfo] = useState('');

  function startEdit() {
    setPaymentInfo(configQ.data?.payment_info || '');
    setPickupInfo(configQ.data?.pickup_info || '');
    setEditing(true);
  }

  function save() {
    upsert.mutate({ paymentInfo, pickupInfo }, {
      onSuccess: () => { setEditing(false); toast?.('Datos guardados'); },
      onError: () => toast?.('Error al guardar'),
    });
  }

  const config = configQ.data || {};

  return (
    <div style={{ borderTop: `1px solid ${CC.line}`, paddingTop: 16, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>Datos de pago/retiro</div>
        <button onClick={editing ? save : startEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: editing ? CC.gold : 'rgba(14,58,92,0.06)', color: editing ? CC.navy900 : CC.navy, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>
          <Icon name={editing ? 'check' : 'edit'} size={13} color={editing ? CC.navy900 : CC.navy} sw={2.4} />
          {editing ? 'Guardar' : 'Editar'}
        </button>
      </div>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={lblStyle}>Datos para transferencia (CBU, alias, titular…)</div>
            <textarea value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} rows={3} placeholder="Ej: Alias: champagnat.rugby · CBU: 00000000..." style={taStyle} />
          </div>
          <div>
            <div style={lblStyle}>Instrucciones de retiro (lugar, horario…)</div>
            <textarea value={pickupInfo} onChange={(e) => setPickupInfo(e.target.value)} rows={3} placeholder="Ej: Retirar los viernes de 18 a 20hs en el predio." style={taStyle} />
          </div>
          <button onClick={() => setEditing(false)} style={{ alignSelf: 'flex-start', border: `1.5px solid ${CC.line}`, background: 'transparent', color: CC.muted, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>Cancelar</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {config.payment_info || config.pickup_info ? (
            <>
              {config.payment_info && (
                <div style={{ background: 'rgba(14,58,92,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={lblStyle}>Pago</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{config.payment_info}</div>
                </div>
              )}
              {config.pickup_info && (
                <div style={{ background: 'rgba(14,58,92,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={lblStyle}>Retiro</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{config.pickup_info}</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.faint }}>Sin datos cargados. Tocá "Editar" para agregar instrucciones de pago y retiro.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminOrdersSheet({ onClose, toast }) {
  const resQ = useReservations();
  const itemsQ = useShopItems();
  const updateStatus = useUpdateReservationStatus();
  const deliver = useDeliverReservation();
  const cancelRes = useCancelReservation();
  const [filter, setFilter] = useState('pendiente');

  const reservations = resQ.data ?? [];
  const items = itemsQ.data ?? [];
  const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.status === filter);

  function markPaid(r) {
    updateStatus.mutate({ id: r.id, status: 'pagado' }, {
      onSuccess: () => toast?.('Marcado como pagado'),
      onError: () => toast?.('Error al actualizar'),
    });
  }

  function markDelivered(r) {
    deliver.mutate({ reservation: r, items }, {
      onSuccess: () => toast?.('Entregado'),
      onError: () => toast?.('Error al entregar'),
    });
  }

  function cancel(r) {
    cancelRes.mutate({ reservation: r, items }, {
      onSuccess: () => toast?.('Reserva cancelada · stock restaurado'),
      onError: () => toast?.('Error al cancelar'),
    });
  }

  const counts = STATUS_FILTERS.slice(1).reduce((acc, sf) => {
    acc[sf.id] = reservations.filter((r) => r.status === sf.id).length;
    return acc;
  }, {});

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.6)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}`, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="bag" size={20} color={CC.gold} sw={2.3} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Pedidos</div>
              {counts.pendiente > 0 && (
                <div style={{ background: CC.gold, color: CC.navy900, borderRadius: 999, padding: '2px 9px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>{counts.pendiente}</div>
              )}
            </div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>{reservations.length} reserva{reservations.length !== 1 ? 's' : ''} en total</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>

        {/* filtros */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '10px 16px 0', paddingBottom: 10, borderBottom: `1px solid ${CC.line}`, flexShrink: 0 }}>
          {STATUS_FILTERS.map((sf) => (
            <Chip key={sf.id} active={filter === sf.id} onClick={() => setFilter(sf.id)}>
              {sf.label}{sf.id !== 'all' && counts[sf.id] > 0 ? ` (${counts[sf.id]})` : ''}
            </Chip>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '14px 16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {resQ.isLoading && <div style={{ textAlign: 'center', padding: 24, fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>}
          {!resQ.isLoading && filtered.length === 0 && (
            <div style={{ padding: '16px 0' }}><Empty t={`Sin pedidos ${filter !== 'all' ? STATUS_STYLE[filter]?.label?.toLowerCase() + 's' : ''}`} /></div>
          )}

          {filtered.map((r) => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE.pendiente;
            const itemName = r.shop_items?.name || 'Producto';
            const photo = (r.shop_items?.photos || [])[0];
            const isPending = r.status === 'pendiente';
            const isPaid = r.status === 'pagado';
            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${CC.line}` }}>
                {/* fila principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: CC.paper, borderBottom: `1px solid ${CC.line}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: photo ? `center/cover url(${photo})` : 'rgba(14,58,92,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!photo && <Icon name="bag" size={20} color={CC.faint} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{itemName}</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 1 }}>Talle {r.size} · {r.quantity} u.</div>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: st.bg, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: st.color, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </div>
                </div>
                {/* detalles */}
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={lblStyle}>Jugador</div>
                      <div style={valStyle}>{r.contact_name || '—'}</div>
                    </div>
                    {r.contact_phone && (
                      <div>
                        <div style={lblStyle}>Celular</div>
                        <div style={valStyle}>{r.contact_phone}</div>
                      </div>
                    )}
                    <div>
                      <div style={lblStyle}>Pago</div>
                      <div style={valStyle}>{r.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo'}</div>
                    </div>
                    <div>
                      <div style={lblStyle}>Fecha</div>
                      <div style={valStyle}>{fmtDate(r.created_at)}</div>
                    </div>
                  </div>
                  {/* acciones */}
                  {(isPending || isPaid) && (
                    <div style={{ display: 'flex', gap: 7, marginTop: 4, flexWrap: 'wrap' }}>
                      {isPending && (
                        <button onClick={() => markPaid(r)} style={actionBtn(CC.navy, '#fff')}>
                          <Icon name="check" size={13} color="#fff" sw={2.4} />Marcar pagado
                        </button>
                      )}
                      {isPaid && (
                        <button onClick={() => markDelivered(r)} style={actionBtn(CC.good, '#fff')}>
                          <Icon name="check" size={13} color="#fff" sw={2.4} />Entregar · descontar stock
                        </button>
                      )}
                      <button onClick={() => cancel(r)} style={actionBtn('rgba(224,82,78,0.1)', CC.bad, `1px solid ${CC.bad}`)}>
                        <Icon name="x" size={13} color={CC.bad} sw={2.4} />Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <ConfigSection toast={toast} />
          </div>
        </div>
      </div>
    </div>
  );
}

const lblStyle = { fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3 };
const valStyle = { fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, marginTop: 2 };
const taStyle = { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '10px 12px', fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, background: '#fff', resize: 'vertical' };
const actionBtn = (bg, color, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  border: border || 'none', background: bg, color,
  borderRadius: 9, padding: '7px 12px', cursor: 'pointer',
  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
});
