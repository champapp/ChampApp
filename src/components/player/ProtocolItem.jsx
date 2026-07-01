import { CC, Icon, fmtDate } from '../../ui';

// Fila de un protocolo de recuperación, compartida entre la ficha del
// jugador (solo lectura) y el panel de Sanidad/tratamiento del admin
// (con botón de eliminar).
export function ProtocolItem({ pr, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: 10, background: '#fff', border: `1px solid ${CC.line}`, borderRadius: 12, padding: '10px 11px' }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(14,58,92,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="check" size={14} color={CC.navy} sw={2.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{pr.text}</div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint, marginTop: 3 }}>{pr.by || 'Fisioterapia'} · {fmtDate(pr.date)}</div>
      </div>
      {onDelete && (
        <button onClick={() => onDelete(pr.id)} title="Eliminar protocolo" style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: 'rgba(224,82,78,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="x" size={14} color={CC.bad} sw={2.5} />
        </button>
      )}
    </div>
  );
}
