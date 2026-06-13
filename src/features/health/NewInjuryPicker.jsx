import { useState } from 'react';
import { CC, Icon, Avatar, Empty } from '../../ui';
import { injuryStatus } from '../../lib/domain';

// Selector de jugador para cargar una lesión nueva (Sanidad admin).
// Excluye a quienes ya tienen una lesión activa.
export function NewInjuryPicker({ players, injuryByPlayer, onPick, onClose }) {
  const [q, setQ] = useState('');
  let list = players.filter((p) => !injuryStatus(injuryByPlayer.get(p.id)));
  if (q.trim()) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  list = list.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '82%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase' }}>Nueva lesión</div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={17} color={CC.navy} sw={2.4} />
            </button>
          </div>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: CC.faint }}><Icon name="search" size={15} /></div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jugador…" style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '9px 10px 9px 32px', fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, background: '#fff' }} />
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {list.length === 0 && <Empty t="Sin jugadores" />}
          {list.map((p) => (
            <button key={p.id} onClick={() => onPick(p)} style={{ display: 'flex', alignItems: 'center', gap: 11, border: `1px solid ${CC.line}`, background: '#fff', borderRadius: 12, padding: '8px 11px', cursor: 'pointer', textAlign: 'left' }}>
              <Avatar name={p.name} photo={p.photo_url} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.faint }}>{p.cat}{p.sub ? ' ' + p.sub : ''}</div>
              </div>
              <Icon name="plus" size={17} color={CC.navy} sw={2.6} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
