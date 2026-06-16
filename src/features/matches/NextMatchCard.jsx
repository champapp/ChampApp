import { CC, Icon, matchLongDate, daysUntil } from '../../ui';
import { psMatchTimes, m17MatchTimes } from '../../lib/domain';

function Row({ icon, label, value, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={16} color={accent || CC.gold} sw={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, fontWeight: 600, color: '#fff', lineHeight: 1.2, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

// Recordatorio del próximo partido del jugador. `match` ya viene calculado por el caller.
export function NextMatchCard({ match: m, player }) {
  if (!m) return null;
  const dleft = daysUntil(m.date);
  const when = dleft === 0 ? '¡Hoy!' : dleft === 1 ? 'Mañana' : 'En ' + dleft + ' días';
  const psTimes = m.cat === 'PS' ? psMatchTimes(m) : [];
  const m17Times = m.cat === 'M17' ? m17MatchTimes(m) : [];

  return (
    <div style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden', background: `linear-gradient(155deg, ${CC.navy} 0%, ${CC.navy900} 100%)`, boxShadow: '0 10px 28px rgba(7,36,61,0.22)', position: 'relative' }}>
      <div style={{ position: 'absolute', right: -22, top: -22, color: 'rgba(249,178,51,0.10)' }}><Icon name="whistle" size={120} color="rgba(249,178,51,0.10)" sw={1.6} /></div>
      {/* encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="whistle" size={16} color={CC.gold} sw={2.2} />
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1, color: CC.gold, textTransform: 'uppercase' }}>Próximo partido</span>
        </div>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 0.4, color: CC.navy900, background: CC.gold, padding: '3px 10px', borderRadius: 999 }}>{when}</span>
      </div>
      {/* rival */}
      <div style={{ padding: '10px 16px 14px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{m.home ? 'Local vs' : 'Visitante vs'}</span>
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30, color: '#fff', lineHeight: 1, marginTop: 2 }}>{m.rival}</div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>{m.comp} · {player.cat}{player.sub ? ' ' + player.sub : ''}</div>
      </div>
      {/* detalle: datos del partido a la izquierda, horarios a la derecha */}
      <div style={{ display: 'flex', gap: 14, padding: '14px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <Row icon="calendar" label="Cuándo" value={matchLongDate(m.date)} />
          <Row icon="pin" label="Dónde" value={m.place} accent={m.home ? CC.good : CC.gold} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {(m.cat === 'PS' || m.cat === 'M17') && (psTimes.length || m17Times.length)
            ? (psTimes.length ? psTimes : m17Times).map((t) => (
              <Row key={t.label} icon="clock" label={t.label} value={(
                <>
                  <div>Kick off {t.time}</div>
                  {t.cite && <div style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.7, marginTop: 1 }}>Citación {t.cite}</div>}
                </>
              )} />
            ))
            : (
              <>
                <Row icon="clock" label="Kick off" value={m.time + ' hs'} />
                {m.cite && <Row icon="whistle" label="Citación" value={m.cite + ' hs'} />}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
