import { useState } from 'react';
import { CC, Icon, Chip, fmtDate } from '../../ui';
import { standingsForCat, standingsWithMovement } from '../../lib/domain';
import { teamCrestSrc, isChampagnatTeam } from '../../lib/rivalCrests';
import { useStandingsTables } from '../../lib/queries';

function MovementTag({ movement }) {
  if (!movement) return <span style={{ width: 26, display: 'inline-block' }} />;
  const up = movement > 0;
  return (
    <span style={{ width: 26, display: 'inline-flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11.5, color: up ? CC.good : CC.bad }}>
      <Icon name={up ? 'chevUp' : 'chevDown'} size={11} color={up ? CC.good : CC.bad} sw={3} />{Math.abs(movement)}
    </span>
  );
}

function StandingsRow({ row }) {
  const crest = teamCrestSrc(row.team);
  const own = isChampagnatTeam(row.team);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 9, background: own ? 'rgba(14,58,92,0.12)' : 'transparent' }}>
      <span style={{ width: 16, flexShrink: 0, textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: CC.navy700 }}>{row.position}</span>
      {crest ? (
        <span style={{ width: 20, height: 20, borderRadius: 5, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 2, boxSizing: 'border-box' }}>
          <img src={crest} alt={row.team} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </span>
      ) : (
        <span style={{ width: 20, flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, minWidth: 0, fontFamily: 'Barlow, sans-serif', fontWeight: own ? 700 : 600, fontSize: 13, color: CC.navy900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.team}</span>
      <span style={{ minWidth: 22, textAlign: 'right', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.navy900 }}>{row.pts}</span>
      <MovementTag movement={row.movement} />
    </div>
  );
}

// Tabla de posiciones de la categoría del jugador (o de una específica si se
// pasa `cat`). Si hay más de una división para esa categoría (ej. PS:
// Primera / Intermedia / Pre-Intermedia) deja elegir cuál ver. No renderiza
// nada si no hay ninguna tabla cargada para esa categoría.
export function StandingsCard({ cat, pad = true }) {
  const tablesQ = useStandingsTables();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  if (tablesQ.isLoading) return null;
  const tables = standingsForCat(tablesQ.data ?? [], cat);
  if (!tables.length) return null;

  const active = tables.find((t) => t.id === activeId) || tables[0];
  const rows = standingsWithMovement(active);

  const cardStyle = {
    marginBottom: 16, borderRadius: 20, overflow: 'hidden',
    background: `linear-gradient(155deg, ${CC.gold} 0%, ${CC.goldDeep} 100%)`,
    boxShadow: '0 10px 28px rgba(230,148,18,0.28)', position: 'relative',
  };

  const header = (
    <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <Icon name="trophy" size={16} color={CC.navy} sw={2.2} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 1, color: CC.navy, textTransform: 'uppercase' }}>Tabla de posiciones</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        {active.updated_at && (
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, color: CC.gold, background: CC.navy, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            Act. {fmtDate(active.updated_at.slice(0, 10))}
          </span>
        )}
        <Icon name={open ? 'chevUp' : 'chevron'} size={16} color="rgba(14,58,92,0.5)" sw={2.3} />
      </div>
    </button>
  );

  return (
    <div style={{ padding: pad ? '16px 16px 0' : 0 }}>
    <div style={cardStyle}>
      <div style={{ position: 'absolute', right: -22, top: -22, pointerEvents: 'none' }}><Icon name="trophy" size={120} color="rgba(14,58,92,0.12)" sw={1.6} /></div>
      {header}
      {!open && (
        <div style={{ borderTop: '1px solid rgba(14,58,92,0.15)', padding: '10px 16px 13px', position: 'relative' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 14, color: 'rgba(14,58,92,0.75)', letterSpacing: 0.2 }}>
            {tables.length > 1 ? tables.map((t) => t.label).join(' · ') : active.label}
          </span>
        </div>
      )}

      {open && (
        <div style={{ borderTop: '1px solid rgba(14,58,92,0.15)', padding: '12px 16px 14px', position: 'relative' }}>
          {tables.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {tables.map((t) => <Chip key={t.id} active={t.id === active.id} onClick={() => setActiveId(t.id)}>{t.label}</Chip>)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {rows.map((r) => <StandingsRow key={r.team} row={r} />)}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
