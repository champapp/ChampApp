import { useState } from 'react';
import { CC, Icon, Field, TextInput } from '../../ui';
import { fisioDateLabel } from '../../lib/domain';
import { useBookFisio } from '../../lib/queries';

// Reservar un turno (o anotarse en lista de espera). El jugador ya está
// identificado por su sesión, así que solo pide el motivo de consulta.
export function FisioBookModal({ date, time, waitlist, playerId, onClose, onBooked, toast }) {
  const [reason, setReason] = useState('');
  const bookMutation = useBookFisio();

  function confirm() {
    if (!reason.trim()) { toast && toast('Indicá el motivo de consulta'); return; }
    bookMutation.mutate({ playerId, date, time, reason: reason.trim(), wait: !!waitlist }, {
      onSuccess: () => {
        onBooked && onBooked();
        onClose();
        toast && toast(waitlist ? 'Te anotamos en la lista de espera' : 'Turno reservado');
      },
      onError: () => toast && toast('No se pudo reservar'),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: waitlist ? CC.gold : CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="medkit" size={20} color={waitlist ? CC.navy900 : '#fff'} sw={2.3} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{waitlist ? 'Lista de espera' : 'Reservar turno'}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 2, textTransform: 'capitalize' }}>{fisioDateLabel(date)}{waitlist ? '' : ' · ' + time + ' hs'}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Motivo de consulta">
            <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Dolor de rodilla, control…" />
          </Field>
          {waitlist && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(249,178,51,0.12)', borderRadius: 11, padding: '10px 12px' }}>
              <Icon name="alert" size={15} color={CC.goldDeep} sw={2.3} />
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: '#6b4e1e' }}>Todos los turnos de este día están ocupados. Te anotamos en lista de espera por orden de llegada.</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={confirm} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />{waitlist ? 'Anotarme' : 'Reservar'}
          </button>
        </div>
      </div>
    </div>
  );
}
