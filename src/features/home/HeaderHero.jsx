import { CC, Icon, Avatar, Ring, fmtPct, rateColor } from '../../ui';
import { PositionBadge } from '../../components/player/PositionBadge';
import { InjuryBadge } from '../../components/player/InjuryBadge';
import { ageFromBirth } from '../../lib/domain';

export function HeaderHero({ player, injury, d, onEdit }) {
  const age = ageFromBirth(player);
  return (
    <div style={{ background: `linear-gradient(160deg, ${CC.navy}, ${CC.navy900})`, color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -50, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(249,178,51,0.07)', pointerEvents: 'none' }} />
      {onEdit && (
        <button onClick={onEdit} style={{ position: 'absolute', right: 16, top: 16, zIndex: 1, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: '7px 12px 7px 9px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
          <Icon name="edit" size={14} color="#fff" sw={2.4} />Editar perfil
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 16px 0', position: 'relative' }}>
        <Avatar name={player.name} photo={player.photo_url} size={88} ring={CC.gold} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 27, lineHeight: 1.02, display: 'flex', alignItems: 'center', gap: 9 }}>
            <span>{player.name}</span>
            <InjuryBadge injury={injury} />
          </div>
          <div style={{ marginTop: 9 }}><PositionBadge player={player} light big /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, color: CC.navy900, background: CC.gold, padding: '2px 8px', borderRadius: 6 }}>{player.cat}{player.sub ? ' · ' + player.sub : ''}</span>
            {age != null && <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>{age} años</span>}
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 20px', position: 'relative' }}>
        <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: 18, padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Ring value={d.att.rate} size={68} stroke={9} color={rateColor(d.att.rate)} track="rgba(14,58,92,0.08)">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink }}>{fmtPct(d.att.rate)}</div>
          </Ring>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>Asistencia</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, lineHeight: 1.05 }}>{d.att.present} de {d.att.total}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, color: d.diff >= 0 ? CC.good : CC.bad, marginTop: 1 }}>{d.diff >= 0 ? '+' : ''}{Math.round(d.diff * 100)}% vs categoría</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: CC.line }} />
          <div style={{ textAlign: 'center', minWidth: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <Icon name="flame" size={18} color={CC.gold} sw={2.2} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: CC.ink, lineHeight: 1 }}>{d.streak.current}</span>
            </div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, color: CC.muted, letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 2 }}>Racha</div>
          </div>
        </div>
      </div>
    </div>
  );
}
