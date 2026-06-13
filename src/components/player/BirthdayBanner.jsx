import { useState } from 'react';
import { CC, Icon } from '../../ui';
import { birthdaysToday, todayISO } from '../../lib/domain';

// Banner de cumpleaños del día para la categoría del jugador (descartable, por día).
export function BirthdayBanner({ me, players }) {
  const today = todayISO();
  const list = birthdaysToday({ players, cat: me.cat, today })
    .filter((p) => !me.sub || !p.sub || p.sub === me.sub);
  const key = 'champ_bday_read_' + me.id + '_' + today;
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  });
  if (!list.length || dismissed) return null;
  function close() {
    try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
    setDismissed(true);
  }

  const names = list.map((p) => (p.id === me.id ? '¡vos!' : p.name));
  const title = list.length === 1
    ? (list[0].id === me.id ? '¡Feliz cumple!' : '¡Feliz cumple a ' + list[0].name.split(' ')[0] + '!')
    : '¡Cumpleaños de hoy!';

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div style={{ position: 'relative', display: 'flex', gap: 12, alignItems: 'flex-start', background: 'linear-gradient(150deg, #1d6f3f, #0c5a2e)', borderRadius: 16, padding: '14px 14px', overflow: 'hidden', boxShadow: '0 6px 18px rgba(12,90,46,0.25)' }}>
        <div style={{ position: 'absolute', right: -16, top: -14, color: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }}><Icon name="cake" size={92} color="rgba(255,255,255,0.1)" sw={1.6} /></div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: CC.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="cake" size={22} color={CC.navy900} sw={2.2} /></div>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: '#fff', letterSpacing: 0.3, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 1.35 }}>
            {list.length === 1 ? (list[0].id === me.id ? 'Que tengas un gran día 🎉' : 'Saludá a tu compañero/a 🎉') : 'Hoy cumplen: ' + names.join(', ')}
          </div>
        </div>
        <button onClick={close} style={{ position: 'relative', width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={16} color="#fff" sw={2.5} /></button>
      </div>
    </div>
  );
}
