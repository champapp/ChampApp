import { useState } from 'react';
import { CC, Icon, Card, fmtDate } from '../../ui';

function AlertLine({ a }) {
  const expired = a.status.level === 'expired';
  const col = expired ? CC.bad : CC.goldDeep;
  return (
    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.ink, lineHeight: 1.35 }}>
      <b>{a.doc.type}</b>
      {expired
        ? <span style={{ color: CC.bad, fontWeight: 700 }}> · venció el {fmtDate(a.doc.expiry)}</span>
        : <span> · vence el {fmtDate(a.doc.expiry)} <b style={{ color: col }}>({a.status.days === 0 ? 'hoy' : 'en ' + a.status.days + (a.status.days === 1 ? ' día' : ' días')})</b></span>}
    </div>
  );
}

function PlayerDocRow({ row, onOpenPlayer }) {
  const { player, alerts } = row;
  return (
    <button
      onClick={() => onOpenPlayer && onOpenPlayer(player.id)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', border: `1px solid ${CC.line}`, borderRadius: 12, background: CC.paper, cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink }}>{player.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
          {alerts.map((a, i) => <AlertLine key={i} a={a} />)}
        </div>
      </div>
      <Icon name="chevron" size={15} color={CC.faint} sw={2.3} />
    </button>
  );
}

// Recuadro desplegable de Inicio (admin): jugadores con documentación
// vencida o por vencer (≤1 mes). No renderiza nada si no hay alertas.
export function DocsExpiringCard({ rows, onOpenPlayer }) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;

  const expiredCount = rows.filter((r) => r.alerts.some((a) => a.status.level === 'expired')).length;

  return (
    <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: expiredCount ? 'rgba(224,82,78,0.12)' : 'rgba(249,178,51,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
          <Icon name="alert" size={20} color={expiredCount ? CC.bad : CC.goldDeep} sw={2.2} />
          <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: expiredCount ? CC.bad : CC.gold, color: expiredCount ? '#fff' : CC.navy900, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxSizing: 'content-box' }}>{rows.length}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Documentación por vencer</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: expiredCount ? CC.bad : CC.muted, marginTop: 3 }}>
            {rows.length} jugador{rows.length > 1 ? 'es' : ''}{expiredCount ? ` · ${expiredCount} vencid${expiredCount > 1 ? 'os' : 'o'}` : ''}
          </div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => <PlayerDocRow key={row.player.id} row={row} onOpenPlayer={onOpenPlayer} />)}
        </div>
      )}
    </Card>
  );
}
