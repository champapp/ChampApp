import { useState } from 'react';
import { CC, Icon, Chip, fmtDate } from '../../ui';
import { CATS, standingsWithMovement } from '../../lib/domain';
import { teamCrestSrc, isChampagnatTeam } from '../../lib/rivalCrests';
import { useStandingsTables } from '../../lib/queries';

const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const CAT_ORDER = CATS.map((c) => c.id);
const SHORT_DIVISION = { 'Primera': 'PRI', 'Intermedia': 'INTER', 'Pre-Intermedia': 'PRE' };

function shortMatchDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return `${SHORT_DAYS[day]} ${d}/${m}`;
}

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

// Tabla de posiciones. Muestra TODAS las tablas cargadas (de cualquier
// categoría), no solo la del jugador, con los chips siempre en el mismo
// orden (Primera-Intermedia-Pre-Intermedia-M19-M17-...). Por defecto arranca
// mostrando la tabla de la categoría del jugador; si no tiene ninguna
// cargada, arranca en la primera de la lista (Primera de PS). `nextMatch`
// (opcional) es el próximo partido del jugador y se muestra como referencia
// arriba de la tabla. No renderiza nada si todavía no hay ninguna tabla
// cargada.
export function StandingsCard({ cat, nextMatch, pad = true }) {
  const tablesQ = useStandingsTables();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  if (tablesQ.isLoading) return null;
  const all = tablesQ.data ?? [];
  if (!all.length) return null;

  // orden fijo de chips (Primera-Intermedia-Pre-Intermedia-M19-M17-...), sin
  // importar la categoría del jugador
  const tables = [...all].sort((a, b) => {
    const ai = CAT_ORDER.indexOf(a.cat), bi = CAT_ORDER.indexOf(b.cat);
    if (ai !== bi) return ai - bi;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.label.localeCompare(b.label);
  });

  // por defecto se muestra la tabla de la categoría del jugador; si no tiene
  // ninguna cargada, la primera de la lista (Primera de PS)
  const defaultActive = tables.find((t) => t.cat === cat) || tables[0];
  const active = tables.find((t) => t.id === activeId) || defaultActive;
  const rows = standingsWithMovement(active);
  const multiCat = new Set(tables.map((t) => t.cat)).size > 1;
  // etiqueta corta para el chip: si la categoría tiene varias divisiones (ej.
  // PS) alcanza con la división (PRI/INTER/PRE); si tiene una sola, con la
  // categoría (M19)
  const chipLabel = (t) => {
    const sameCat = tables.filter((x) => x.cat === t.cat);
    if (sameCat.length > 1) return SHORT_DIVISION[t.label] || t.label.slice(0, 4).toUpperCase();
    return t.cat;
  };
  const summary = multiCat
    ? [...new Set(tables.map((t) => t.cat))].join(' · ')
    : tables.length > 1 ? tables.map((t) => t.label).join(' · ') : active.label;

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
    {nextMatch && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 2px 8px' }}>
        <Icon name="calendar" size={13} color={CC.muted} sw={2.3} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, letterSpacing: 0.2, color: CC.muted, textTransform: 'uppercase' }}>
          Próxima fecha · {shortMatchDate(nextMatch.date)} · {nextMatch.home ? 'vs' : '@'} {nextMatch.rival}
        </span>
      </div>
    )}
    <div style={cardStyle}>
      <div style={{ position: 'absolute', right: -22, top: -22, pointerEvents: 'none' }}><Icon name="trophy" size={120} color="rgba(14,58,92,0.12)" sw={1.6} /></div>
      {header}
      {!open && (
        <div style={{ borderTop: '1px solid rgba(14,58,92,0.15)', padding: '10px 16px 13px', position: 'relative' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 14, color: 'rgba(14,58,92,0.75)', letterSpacing: 0.2 }}>
            {summary}
          </span>
        </div>
      )}

      {open && (
        <div style={{ borderTop: '1px solid rgba(14,58,92,0.15)', padding: '12px 16px 14px', position: 'relative' }}>
          {tables.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {tables.map((t) => <Chip key={t.id} active={t.id === active.id} onClick={() => setActiveId(t.id)}>{chipLabel(t)}</Chip>)}
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
