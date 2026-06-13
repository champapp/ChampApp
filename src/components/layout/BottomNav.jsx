import { CC, Icon } from '../../ui';

const ADMIN_ITEMS = [
  { id: 'home', icon: 'home', label: 'Inicio' },
  { id: 'attendance', icon: 'attendance', label: 'Asistencia' },
  { id: 'players', icon: 'players', label: 'Jugadores' },
  { id: 'matches', icon: 'whistle', label: 'Partidos' },
  { id: 'gym', icon: 'weight', label: 'Gimnasio' },
  { id: 'health', icon: 'medkit', label: 'Sanidad' },
  { id: 'shop', icon: 'bag', label: 'Shop' },
  { id: 'export', icon: 'download', label: 'Exportar' },
];

const PLAYER_ITEMS = [
  { id: 'home', icon: 'user', label: 'Mi perfil' },
  { id: 'attendance', icon: 'attendance', label: 'Asistencia' },
  { id: 'gym', icon: 'weight', label: 'Gym' },
  { id: 'health', icon: 'medkit', label: 'Sanidad' },
  { id: 'calendar', icon: 'calendar', label: 'Calendario' },
  { id: 'shop', icon: 'bag', label: 'Shop' },
];

export function BottomNav({ tab, setTab, isAdmin }) {
  const items = isAdmin ? ADMIN_ITEMS : PLAYER_ITEMS;

  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 40,
      background: CC.navy900,
      paddingBottom: 'max(14px, env(safe-area-inset-bottom))', paddingTop: 9,
      boxShadow: '0 -8px 24px rgba(7,36,61,0.28)',
      borderTopLeftRadius: 22, borderTopRightRadius: 22,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {items.map((it) => {
          const active = tab === it.id;
          return (
            <button key={it.id} onClick={() => setTab(it.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 4px', position: 'relative', minWidth: 0, flex: 1,
            }}>
              {active && <div style={{ position: 'absolute', top: -9, width: 24, height: 3.5, borderRadius: 3, background: CC.gold }} />}
              <div style={{ color: active ? CC.gold : 'rgba(255,255,255,0.55)' }}>
                <Icon name={it.icon} size={22} sw={active ? 2.4 : 2} />
              </div>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 11.5,
                letterSpacing: 0.3, color: active ? '#fff' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap',
              }}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
