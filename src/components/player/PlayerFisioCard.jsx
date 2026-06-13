import { CC, Icon } from '../../ui';
import { fisioForPlayer, fisioDateLabel } from '../../lib/domain';
import { useCancelFisio } from '../../lib/queries';

// Turno(s) de fisio del jugador (próximos), con botón para cancelar.
export function PlayerFisioCard({ playerId, bookings, pad = true, toast }) {
  const cancelMutation = useCancelFisio();
  const list = fisioForPlayer(bookings, playerId);
  if (!list.length) return null;

  function cancel(id) {
    cancelMutation.mutate(id, {
      onSuccess: () => toast && toast('Turno cancelado'),
      onError: () => toast && toast('No se pudo cancelar'),
    });
  }

  return (
    <div style={{ padding: pad ? '16px 16px 0' : 0 }}>
      {list.map((b) => (
        <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(150deg, #15506f, #0c3650)', borderRadius: 16, padding: '13px 14px', marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(249,178,51,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="medkit" size={20} color={CC.gold} sw={2.3} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Turno con la fisio{b.wait ? ' · lista de espera' : ''}</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff', lineHeight: 1.1, textTransform: 'capitalize' }}>{fisioDateLabel(b.date)}{b.time ? ' · ' + b.time + ' hs' : ''}</div>
            {b.reason && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{b.reason}</div>}
          </div>
          <button onClick={() => cancel(b.id)} style={{ border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', borderRadius: 9, padding: '7px 11px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>Cancelar</button>
        </div>
      ))}
    </div>
  );
}
