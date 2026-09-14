import { useState } from 'react';
import { CC, Icon, Card, Chip, fmtDate } from '../../ui';
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 9, background: own ? 'rgba(249,178,51,0.14)' : 'transparent' }}>
      <span style={{ width: 16, flexShrink: 0, textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: CC.muted }}>{row.position}</span>
      {crest ? (
        <img src={crest} alt={row.team} style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
      ) : (
        <span style={{ width: 20, flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, minWidth: 0, fontFamily: 'Barlow, sans-serif', fontWeight: own ? 700 : 600, fontSize: 13, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.team}</span>
      <span style={{ minWidth: 22, textAlign: 'right', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.navy }}>{row.pts}</span>
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

  return (
    <div style={{ padding: pad ? '16px 16px 0' : 0 }}>
    <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="trophy" size={19} color={CC.navy} sw={2.1} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Tabla de posiciones</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 3 }}>{tables.length > 1 ? tables.map((t) => t.label).join(' · ') : active.label}</div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>

      {open && (
        <div style={{ padding: '0 10px 12px' }}>
          {tables.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 2px', marginBottom: 8 }}>
              {tables.map((t) => <Chip key={t.id} active={t.id === active.id} onClick={() => setActiveId(t.id)}>{t.label}</Chip>)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {rows.map((r) => <StandingsRow key={r.team} row={r} />)}
          </div>
          {active.updated_at && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint, marginTop: 8, padding: '0 2px' }}>Actualizada {fmtDate(active.updated_at.slice(0, 10))}</div>
          )}
        </div>
      )}
    </Card>
    </div>
  );
}
