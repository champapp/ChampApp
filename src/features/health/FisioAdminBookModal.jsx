import { useState } from 'react';
import { CC, Icon, Avatar, Field, TextInput } from '../../ui';
import { fisioDateLabel } from '../../lib/domain';
import { useBookFisio } from '../../lib/queries';

// Reservar un turno (admin) a nombre de un jugador con cuenta en la app -y
// que le aparezca en su agenda como si lo hubiese reservado él mismo- o de
// alguien sin cuenta, cargando el nombre a mano.
export function FisioAdminBookModal({ date, time, waitlist, players, onClose, onBooked, toast }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [reason, setReason] = useState('');
  const bookMutation = useBookFisio();

  const list = q.trim()
    ? players.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : [];

  function pick(p) {
    setSelected(p);
    setGuestName('');
    setQ('');
  }

  function confirm() {
    if (!selected && !guestName.trim()) { toast && toast('Elegí un jugador o cargá un nombre'); return; }
    if (!reason.trim()) { toast && toast('Indicá el motivo de consulta'); return; }
    bookMutation.mutate({
      playerId: selected ? selected.id : null,
      guestName: selected ? null : guestName.trim(),
      date, time, reason: reason.trim(), wait: !!waitlist,
    }, {
      onSuccess: () => {
        onBooked && onBooked();
        onClose();
        toast && toast(waitlist ? 'Anotado en la lista de espera' : 'Turno reservado');
      },
      onError: () => toast && toast('No se pudo reservar'),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: waitlist ? CC.gold : CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="medkit" size={20} color={waitlist ? CC.navy900 : '#fff'} sw={2.3} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{waitlist ? 'Anotar en lista de espera' : 'Reservar turno'}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 2, textTransform: 'capitalize' }}>{fisioDateLabel(date)}{waitlist ? '' : ' · ' + time + ' hs'}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Jugador">
            {selected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1.5px solid ${CC.line}`, borderRadius: 12, padding: '8px 10px', background: '#fff' }}>
                <Avatar name={selected.name} photo={selected.photo_url} size={34} />
                <div style={{ flex: 1, minWidth: 0, fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.name}</div>
                <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', color: CC.bad, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>Cambiar</button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: CC.faint }}><Icon name="search" size={15} /></div>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jugador con cuenta en la app…" style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '9px 10px 9px 32px', fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, background: '#fff' }} />
                </div>
                {q.trim() && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {list.length === 0 && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.faint, padding: '6px 2px' }}>Sin resultados</div>}
                    {list.map((p) => (
                      <button key={p.id} onClick={() => pick(p)} style={{ display: 'flex', alignItems: 'center', gap: 9, border: `1px solid ${CC.line}`, background: '#fff', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', textAlign: 'left' }}>
                        <Avatar name={p.name} photo={p.photo_url} size={30} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint }}>{p.cat}{p.sub ? ' ' + p.sub : ''}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Field>

          {!selected && (
            <Field label="O nombre (no tiene cuenta en la app)">
              <TextInput value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Ej: Juan Pérez" />
            </Field>
          )}

          <Field label="Motivo de consulta">
            <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Dolor de rodilla, control…" />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={confirm} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />{waitlist ? 'Anotar' : 'Reservar'}
          </button>
        </div>
      </div>
    </div>
  );
}
