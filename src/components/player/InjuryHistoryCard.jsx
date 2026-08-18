import { useState } from 'react';
import { CC, Icon, fmtDate } from '../../ui';
import { protocolsForInjury } from '../../lib/domain';
import { useAllInjuries, useInjuryProtocols } from '../../lib/queries';
import { ProtocolItem } from './ProtocolItem';

function PastInjuryRow({ injury, protocols }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${CC.line}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', border: 'none', background: CC.paper, cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink, lineHeight: 1.3 }}>{injury.reason || 'Sin diagnóstico cargado'}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 2 }}>
            {injury.since ? fmtDate(injury.since) : '—'}{injury.closed_at ? ' – recuperado ' + fmtDate(injury.closed_at.slice(0, 10)) : ''}
          </div>
        </div>
        {protocols.length > 0 && <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint, fontWeight: 600, flexShrink: 0 }}>{protocols.length} protocolo{protocols.length > 1 ? 's' : ''}</span>}
        <Icon name={open ? 'chevUp' : 'chevron'} size={15} color={CC.faint} sw={2.3} />
      </button>
      {open && (
        <div style={{ padding: '10px 11px', borderTop: `1px solid ${CC.line}`, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {protocols.length ? protocols.map((pr) => <ProtocolItem key={pr.id} pr={pr} />) : (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, textAlign: 'center' }}>Sin protocolos cargados.</div>
          )}
        </div>
      )}
    </div>
  );
}

// Historial de lesiones ya cerradas de un jugador (la activa se muestra
// aparte, vía InjuryCard/SanidadRow). No renderiza nada si no tiene ninguna.
export function InjuryHistoryCard({ playerId }) {
  const [open, setOpen] = useState(false);
  const injuriesQ = useAllInjuries();
  const protocolsQ = useInjuryProtocols();

  if (injuriesQ.isLoading || protocolsQ.isLoading) return null;

  const past = (injuriesQ.data ?? [])
    .filter((i) => i.player_id === playerId && i.closed_at)
    .sort((a, b) => (b.since || '').localeCompare(a.since || ''));

  if (!past.length) return null;

  const allProtocols = protocolsQ.data ?? [];

  return (
    <div style={{ border: `1px solid ${CC.line}`, borderRadius: 16, background: '#fff', overflow: 'hidden', marginBottom: 16 }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="medkit" size={20} color={CC.navy} sw={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink, letterSpacing: 0.2, textTransform: 'uppercase' }}>Historial de lesiones</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>{past.length} {past.length > 1 ? 'lesiones anteriores' : 'lesión anterior'}</div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {past.map((inj) => (
            <PastInjuryRow key={inj.id} injury={inj} protocols={protocolsForInjury(allProtocols, inj.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
