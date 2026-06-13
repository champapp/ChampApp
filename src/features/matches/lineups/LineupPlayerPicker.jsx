import { useState } from 'react';
import { CC, Icon, Avatar, Chip, Empty } from '../../../ui';
import { usePlayers, useActiveInjuries } from '../../../lib/queries';
import { injuryStatus } from '../../../lib/domain';
import { InjuryDot } from '../../../components/player/InjuryDot';

// Selector de jugador para un puesto de la alineación.
export function LineupPlayerPicker({ cat, used, onPick, onClear, onClose, slotLabel }) {
  const playersQ = usePlayers();
  const injuriesQ = useActiveInjuries();
  const [scope, setScope] = useState('cat'); // 'cat' | 'otros'
  const [q, setQ] = useState('');

  if (playersQ.isLoading || injuriesQ.isLoading) return null;

  const injuryByPlayer = new Map(injuriesQ.data.map((i) => [i.player_id, i]));

  let list = scope === 'cat' ? playersQ.data.filter((p) => p.cat === cat) : playersQ.data;
  if (q.trim()) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.username || '').toLowerCase().includes(q.toLowerCase()));
  list = list.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '82%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase' }}>{slotLabel}</div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={17} color={CC.navy} sw={2.4} /></button>
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
            <Chip active={scope === 'cat'} onClick={() => setScope('cat')}>{cat}</Chip>
            <Chip active={scope === 'otros'} onClick={() => setScope('otros')}>Otros</Chip>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: CC.faint }}><Icon name="search" size={15} /></div>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '7px 10px 7px 32px', fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, background: '#fff' }} />
            </div>
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {onClear && <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${CC.line}`, background: '#fff', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', color: CC.bad, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}><Icon name="x" size={15} color={CC.bad} sw={2.5} />Quitar del puesto</button>}
          {list.length === 0 && <Empty t="Sin jugadores" />}
          {list.map((p) => {
            const taken = used[p.id];
            const ist = injuryStatus(injuryByPlayer.get(p.id));
            return (
              <button key={p.id} onClick={() => !taken && onPick(p.id)} disabled={!!taken} style={{ display: 'flex', alignItems: 'center', gap: 11, border: `1px solid ${CC.line}`, background: taken ? 'rgba(14,58,92,0.04)' : '#fff', borderRadius: 12, padding: '8px 11px', cursor: taken ? 'default' : 'pointer', textAlign: 'left', opacity: taken ? 0.55 : 1 }}>
                <Avatar name={p.name} photo={p.photo_url} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <InjuryDot injury={injuryByPlayer.get(p.id)} />
                  </div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.faint }}>{p.cat}{p.sub ? ' ' + p.sub : ''}{p.pos_short ? ' · ' + p.pos_short : ''}{ist ? ' · ' + (ist.color === 'red' ? 'lesión +7d' : 'lesión ' + ist.days + 'd') : ''}</div>
                </div>
                {taken ? <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: CC.faint }}>EN USO</span> : <Icon name="plus" size={17} color={CC.navy} sw={2.6} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
