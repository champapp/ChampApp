import { CC, Icon, Crest } from '../../ui';
import { useAuth } from '../../features/auth/useAuth';
import { AttendanceAlertBell } from '../admin/AttendanceAlertBell';

export function AppHeader({ onOpenAlertPlayer, onOpenSettings }) {
  const { role, player, signOut } = useAuth();
  const isAdmin = role === 'admin';
  const subtitle = isAdmin
    ? 'Champagnat Rugby · Admin'
    : player
    ? `${player.nombre} ${player.apellido}`
    : 'Champagnat Rugby';

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: `linear-gradient(180deg, ${CC.navy} 0%, ${CC.navy} 70%, rgba(14,58,92,0.96) 100%)`,
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 11,
      boxShadow: '0 4px 18px rgba(7,36,61,0.25)',
    }}>
      <div style={{ background: '#fff', borderRadius: 11, padding: 4, display: 'flex' }}>
        <Crest size={32} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 23, color: '#fff', letterSpacing: 0.6, lineHeight: 1 }}>
          Champ<span style={{ color: CC.gold }}>App</span>
        </div>
        <div style={{
          fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: 'rgba(255,255,255,0.55)',
          letterSpacing: 1, textTransform: 'uppercase', marginTop: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {subtitle}
        </div>
      </div>
      {isAdmin && <AttendanceAlertBell onOpenPlayer={onOpenAlertPlayer} />}
      <button
        onClick={onOpenSettings}
        aria-label="Notificaciones"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
        }}
      >
        <Icon name="settings" size={18} color="#fff" sw={2.2} />
      </button>
      <button
        onClick={signOut}
        aria-label="Cerrar sesión"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
        }}
      >
        <Icon name="logout" size={18} color="#fff" sw={2.2} />
      </button>
    </div>
  );
}
