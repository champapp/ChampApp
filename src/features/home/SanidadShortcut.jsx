import { CC, Icon, Card } from '../../ui';

// Acceso directo a Sanidad desde Inicio (admin): muestra cuántos jugadores
// están en recuperación y abre la pestaña "Sanidad" al tocarlo.
export function SanidadShortcut({ count, onOpen }) {
  const n = count || 0;
  return (
    <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={onOpen} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: n ? 'rgba(224,82,78,0.12)' : 'rgba(30,158,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
          <Icon name="medkit" size={20} color={n ? CC.bad : CC.good} sw={2.2} />
          {n > 0 && <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: CC.bad, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxSizing: 'content-box' }}>{n}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Sanidad</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: n ? CC.bad : CC.muted, marginTop: 3 }}>{n ? `${n} jugador${n > 1 ? 'es' : ''} en recuperación` : 'Plantel sano · sin lesionados'}</div>
        </div>
        <Icon name="chevron" size={18} color={CC.faint} sw={2.3} />
      </button>
    </Card>
  );
}
