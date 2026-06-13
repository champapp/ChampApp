import { useState } from 'react';
import { CC, Icon, matchLabelShort } from '../../../ui';
import { lineupsForCat, todayISO } from '../../../lib/domain';
import { useLineups, useMatches } from '../../../lib/queries';
import { LineupPitch } from './LineupPitch';

// Equipo(s) del partido en el inicio del jugador.
export function PlayerLineups({ me, pad = true }) {
  const lineupsQ = useLineups();
  const matchesQ = useMatches();
  const [openMap, setOpenMap] = useState({});

  if (lineupsQ.isLoading || matchesQ.isLoading) return null;

  const list = lineupsForCat({ lineups: lineupsQ.data, matches: matchesQ.data, cat: me.cat, today: todayISO() });
  if (!list.length) return null;

  return (
    <div style={{ padding: pad ? '16px 16px 0' : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Icon name="players" size={18} color={CC.gold} sw={2.3} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3 }}>Equipo para el partido</span>
      </div>
      {list.map((l) => {
        const open = openMap[l.id] !== false; // abierto por defecto
        const m = matchesQ.data.find((x) => x.id === l.match_id);
        return (
          <div key={l.id} style={{ marginBottom: 12 }}>
            <button onClick={() => setOpenMap((s) => ({ ...s, [l.id]: !open }))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${CC.line}`, background: '#fff', borderRadius: open ? '14px 14px 0 0' : 14, padding: '11px 13px', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="players" size={17} color={CC.navy} sw={2.1} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16.5, color: CC.ink, letterSpacing: 0.2, lineHeight: 1.05 }}>{l.name}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 1 }}>{l.cat}{m ? ' · ' + matchLabelShort(m) : ''}</div>
              </div>
              <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
            </button>
            {open && <div style={{ border: `1px solid ${CC.line}`, borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}><LineupPitch lineup={l} embedded /></div>}
          </div>
        );
      })}
    </div>
  );
}
