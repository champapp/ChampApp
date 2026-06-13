import { useState } from 'react';
import { CC, Icon, fmtDate } from '../../ui';
import { injuryStatus } from '../../lib/domain';
import { ProtocolItem } from './ProtocolItem';

// Ficha de lesión del jugador (perfil / Sanidad propia): desplegable, muestra
// diagnóstico, retorno estimado y los protocolos de recuperación cargados por
// fisioterapia. Solo lectura — la carga la hace el admin desde Sanidad.
export function InjuryCard({ injury, protocols = [] }) {
  const st = injuryStatus(injury);
  const [open, setOpen] = useState(false);
  if (!st) return null;
  const red = st.color === 'red';
  const col = red ? CC.bad : CC.gold;
  const bg = red ? 'rgba(224,82,78,0.07)' : 'rgba(249,178,51,0.1)';

  return (
    <div style={{ background: bg, border: `1.5px solid ${col}`, borderRadius: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '13px 14px' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="medkit" size={20} color="#fff" sw={2.3} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink, letterSpacing: 0.2, textTransform: 'uppercase' }}>Lesionado</span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: '#fff', background: col, borderRadius: 999, padding: '2px 9px' }}>
              {red ? '+7 días' : st.days <= 0 ? 'vuelve hoy' : 'faltan ' + st.days + (st.days === 1 ? ' día' : ' días')}
            </span>
          </div>
          {st.reason && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, marginTop: 4, lineHeight: 1.35 }}>{st.reason}</div>}
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 4 }}>Retorno estimado: <b style={{ color: CC.ink }}>{fmtDate(st.returnDate)}</b></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Icon name="medkit" size={14} color={col} sw={2.3} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 0.3, color: col, textTransform: 'uppercase' }}>
              {protocols.length ? `${protocols.length} protocolo${protocols.length > 1 ? 's' : ''} de recuperación` : 'Plan de recuperación'} · {open ? 'ocultar' : 'ver'}
            </span>
          </div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={col} sw={2.4} />
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{ borderTop: `1.5px solid ${col}33`, paddingTop: 12 }}>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="medkit" size={13} color={CC.muted} sw={2.3} />Indicaciones del equipo de fisioterapia
            </div>
            {protocols.length === 0 ? (
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted, background: '#fff', border: `1px dashed ${CC.line}`, borderRadius: 12, padding: '14px 13px', textAlign: 'center' }}>
                El equipo de fisioterapia aún no cargó protocolos. Te avisaremos acá cuando estén disponibles.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {protocols.map((pr) => <ProtocolItem key={pr.id} pr={pr} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
