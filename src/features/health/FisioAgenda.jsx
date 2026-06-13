import { useState } from 'react';
import { CC, Icon, Avatar } from '../../ui';
import { fisioUpcomingDates, fisioSlotTimes, fisioBookingAt, fisioWaitlist, fisioDateLabel } from '../../lib/domain';
import { useFisioBookings, usePlayers, useCancelFisio } from '../../lib/queries';
import { InjuryDot } from '../../components/player/InjuryDot';
import { FisioBookModal } from './FisioBookModal';

// Agenda de turnos de fisio (lunes y miércoles, 17–20h cada 20').
// `mode`: 'player' (reservar/cancelar el propio turno) o 'admin' (gestionar
// turnos: tratamiento, liberar). `injuryByPlayer` (opcional, admin) muestra
// el InjuryDot de cada jugador con turno.
export function FisioAgenda({ mode, playerId, injuryByPlayer, onOpenTreatment, toast }) {
  const bookingsQ = useFisioBookings();
  const playersQ = usePlayers();
  const cancelMutation = useCancelFisio();

  const dates = fisioUpcomingDates();
  const [date, setDate] = useState(dates[0]);
  const [book, setBook] = useState(null); // { time } | { wait: true }
  const [expanded, setExpanded] = useState(null);
  const [releasingId, setReleasingId] = useState(null);

  if (bookingsQ.isLoading || playersQ.isLoading) {
    return <div style={{ fontFamily: 'Barlow, sans-serif', color: CC.muted, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Cargando agenda…</div>;
  }

  const bookings = bookingsQ.data ?? [];
  const players = playersQ.data ?? [];
  const slots = fisioSlotTimes();
  const wl = fisioWaitlist(bookings, date);
  const freeCount = slots.filter((t) => !fisioBookingAt(bookings, date, t)).length;
  const isAdmin = mode === 'admin';

  function release(id) {
    cancelMutation.mutate(id, {
      onSuccess: () => { setExpanded(null); setReleasingId(null); toast && toast('Turno liberado'); },
      onError: () => toast && toast('No se pudo liberar el turno'),
    });
  }
  function cancelOwn(id) {
    cancelMutation.mutate(id, {
      onSuccess: () => { setExpanded(null); toast && toast('Turno cancelado'); },
      onError: () => toast && toast('No se pudo cancelar'),
    });
  }

  return (
    <div>
      <div style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 16, background: `linear-gradient(150deg, ${CC.navy}, ${CC.navy900})`, color: '#fff', position: 'relative' }}>
        <div style={{ position: 'absolute', right: -22, top: -18, pointerEvents: 'none' }}><Icon name="medkit" size={110} color="rgba(249,178,51,0.12)" sw={1.5} /></div>
        <div style={{ padding: 16, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Icon name="medkit" size={18} color={CC.gold} sw={2.3} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, color: CC.gold, textTransform: 'uppercase' }}>Agenda Fisio</span>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1 }}>Turnos de fisioterapia</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 5 }}>Lunes y miércoles · 17:00 a 20:00 hs · cada 20 minutos</div>
        </div>
      </div>

      {/* selector de fecha */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {dates.map((d) => {
          const active = d === date;
          const free = slots.filter((t) => !fisioBookingAt(bookings, d, t)).length;
          return (
            <button key={d} onClick={() => { setDate(d); setExpanded(null); }} style={{ flexShrink: 0, border: `1.5px solid ${active ? CC.navy : CC.line}`, background: active ? CC.navy : '#fff', borderRadius: 13, padding: '9px 13px', cursor: 'pointer', textAlign: 'center', minWidth: 78 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: active ? '#fff' : CC.ink, letterSpacing: 0.2, textTransform: 'capitalize' }}>{fisioDateLabel(d).split(' ')[0]}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: active ? '#fff' : CC.navy, lineHeight: 1 }}>{d.slice(8)}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, color: active ? (free ? '#8fe3b4' : CC.gold) : (free ? CC.good : CC.bad), marginTop: 2 }}>{free ? free + ' libres' : 'completo'}</div>
            </button>
          );
        })}
      </div>

      {/* turnos del día */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {slots.map((t) => {
          const b = fisioBookingAt(bookings, date, t);
          const open = expanded === t;
          const pl = b && b.player_id != null ? players.find((p) => p.id === b.player_id) : null;
          const canOpen = b || mode === 'player';
          return (
            <div key={t} style={{ border: `1.5px solid ${b ? CC.line : 'rgba(14,58,92,0.2)'}`, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              <button
                onClick={() => (b ? setExpanded(open ? null : t) : (mode === 'player' && setBook({ time: t })))}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'transparent', padding: '11px 12px', cursor: canOpen ? 'pointer' : 'default', textAlign: 'left' }}
              >
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.navy, flexShrink: 0, width: 48 }}>{t}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {b ? (
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{pl ? pl.name : (b.reason || 'Turno reservado')}</span>
                  ) : (
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, color: CC.good, letterSpacing: 0.3 }}>LIBRE</span>
                  )}
                </div>
                {b ? <Icon name={open ? 'chevUp' : 'chevron'} size={16} color={CC.faint} sw={2.4} /> : (mode === 'player' && <Icon name="plus" size={16} color={CC.navy} sw={2.6} />)}
              </button>
              {b && open && (
                <div style={{ borderTop: `1px solid ${CC.line}`, padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar name={pl ? pl.name : '?'} photo={pl ? pl.photo_url : null} size={52} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink, letterSpacing: 0.2 }}>{pl ? pl.name : 'Jugador'}</span>
                      {pl && <InjuryDot injury={injuryByPlayer ? injuryByPlayer.get(pl.id) : null} />}
                    </div>
                    {pl && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 1 }}>{pl.cat}{pl.sub ? ' ' + pl.sub : ''}{pl.phone ? ' · ' + pl.phone : ''}</div>}
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, marginTop: 7, background: CC.paper, borderRadius: 9, padding: '8px 10px' }}><b style={{ color: CC.muted, fontWeight: 700 }}>Motivo:</b> {b.reason || '—'}</div>

                    {releasingId === b.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted }}>¿Liberar este turno?</span>
                        <button onClick={() => setReleasingId(null)} style={{ border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, borderRadius: 9, padding: '7px 12px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>No</button>
                        <button onClick={() => release(b.id)} style={{ border: 'none', background: CC.bad, color: '#fff', borderRadius: 9, padding: '7px 12px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>Sí, liberar</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
                        {isAdmin && pl && <button onClick={() => onOpenTreatment && onOpenTreatment(pl)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: CC.navy, color: '#fff', borderRadius: 9, padding: '7px 13px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5 }}><Icon name="medkit" size={15} color={CC.gold} sw={2.4} />Tratamiento</button>}
                        {isAdmin && <button onClick={() => setReleasingId(b.id)} style={{ border: `1.5px solid ${CC.bad}`, background: 'rgba(224,82,78,0.06)', color: CC.bad, borderRadius: 9, padding: '7px 13px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5 }}>Liberar turno</button>}
                        {!isAdmin && b.player_id === playerId && <button onClick={() => cancelOwn(b.id)} style={{ border: `1.5px solid ${CC.bad}`, background: 'rgba(224,82,78,0.06)', color: CC.bad, borderRadius: 9, padding: '7px 13px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5 }}>Cancelar turno</button>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* lista de espera */}
      {mode === 'player' && freeCount === 0 && (
        <button onClick={() => setBook({ wait: true })} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1.5px solid ${CC.gold}`, background: 'rgba(249,178,51,0.1)', color: CC.goldDeep, padding: 13, borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
          <Icon name="plus" size={16} color={CC.goldDeep} sw={2.6} />Anotarme en lista de espera
        </button>
      )}
      {wl.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 8 }}>Lista de espera ({wl.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {wl.map((b, i) => {
              const pl = b.player_id != null ? players.find((p) => p.id === b.player_id) : null;
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${CC.line}`, borderRadius: 11, padding: '9px 12px', background: '#fff' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(249,178,51,0.18)', color: CC.goldDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl ? pl.name : 'Jugador'}</span>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.faint, whiteSpace: 'nowrap' }}>{b.reason}</span>
                  {!isAdmin && b.player_id === playerId && <button onClick={() => cancelOwn(b.id)} style={{ border: 'none', background: 'transparent', color: CC.bad, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5 }}>Cancelar</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {book && (
        <FisioBookModal date={date} time={book.time} waitlist={!!book.wait} playerId={playerId} onClose={() => setBook(null)} toast={toast} />
      )}
    </div>
  );
}
