import { Card, CC, Icon, Ring, fmtPct, rateColor } from '../../ui';
import { BadgeRail } from '../../components/player/BadgeRail';

// Widgets del feed personalizable del jugador (FeedBoard).
export function buildFeedWidgets(player, d) {
  const list = [];

  list.push({
    id: 'asistencia', label: 'Asistencia', icon: 'attendance',
    node: (
      <Card pad={16} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Ring value={d.att.rate} size={66} stroke={9} color={rateColor(d.att.rate)} track="rgba(14,58,92,0.08)">
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink }}>{fmtPct(d.att.rate)}</div>
        </Ring>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1 }}>Asistencia</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted, marginTop: 3 }}>{d.att.present} de {d.att.total} prácticas</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, background: 'rgba(249,178,51,0.16)', color: CC.goldDeep, borderRadius: 999, padding: '3px 9px' }}>
            <Icon name="flame" size={13} color={CC.goldDeep} sw={2.4} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5 }}>Racha {d.streak.current}</span>
          </div>
        </div>
      </Card>
    ),
  });

  if (d.badges.length) {
    list.push({
      id: 'logros', label: 'Mis logros', icon: 'medal',
      node: (
        <Card pad={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="medal" size={18} color={CC.gold} sw={2.3} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3 }}>Mis logros</span>
          </div>
          <BadgeRail badges={d.badges} inline />
        </Card>
      ),
    });
  }

  if (player.peso != null || player.talla != null || d.imc != null) {
    list.push({
      id: 'fisicos', label: 'Datos físicos', icon: 'ruler',
      node: (
        <Card pad={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="ruler" size={18} color={CC.gold} sw={2.3} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3 }}>Datos físicos</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { v: player.peso, u: 'kg', l: 'Peso' },
              { v: player.talla, u: 'cm', l: 'Talla' },
              { v: d.imc, u: '', l: 'IMC', c: d.imcColor, sub: d.imcCat },
            ].map((x) => (
              <div key={x.l} style={{ flex: 1, background: CC.paper, borderRadius: 13, padding: '11px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 25, color: x.c || CC.ink, lineHeight: 1 }}>{x.v ?? '–'}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.muted, fontWeight: 600, letterSpacing: 0.3, marginTop: 4 }}>{x.l}{x.u ? ' (' + x.u + ')' : ''}</div>
                {x.sub && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 9.5, color: x.c, fontWeight: 700, marginTop: 2 }}>{x.sub}</div>}
              </div>
            ))}
          </div>
        </Card>
      ),
    });
  }

  const exerciseKeys = Object.keys(d.gymByExercise);
  if (exerciseKeys.length) {
    list.push({
      id: 'marcas', label: 'Mejores marcas', icon: 'trophy',
      node: (
        <Card pad={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="trophy" size={18} color={CC.gold} sw={2.3} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3 }}>Mejores marcas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {exerciseKeys.map((k) => {
              const s = d.gymByExercise[k];
              const best = s.reduce((m, x) => (x.value > m.value ? x : m), s[0]);
              return (
                <div key={k} style={{ background: CC.paper, borderRadius: 12, padding: '10px 11px' }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 11.5, color: CC.muted, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: CC.navy, lineHeight: 0.9 }}>{best.value}</span>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted, fontWeight: 600 }}>{best.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ),
    });
  }

  if (player.objetivo) {
    list.push({
      id: 'objetivo', label: 'Objetivo de gym', icon: 'target',
      node: (
        <Card pad={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(249,178,51,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="target" size={20} color={CC.goldDeep} /></div>
          <div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>Mi objetivo de gimnasio</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 15.5, color: CC.ink, marginTop: 1 }}>{player.objetivo}</div>
          </div>
        </Card>
      ),
    });
  }

  return list;
}
