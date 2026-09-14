import { useState } from 'react';
import { CC, Icon, fmtDate, fmtDateTime } from '../../ui';
import { injuryStatus, feedbackForInjury } from '../../lib/domain';
import { useInjuryFeedback, useAddInjuryFeedback, useDeleteInjuryFeedback } from '../../lib/queries';
import { ProtocolItem } from './ProtocolItem';

const FEEDBACK_MAX = 60;

// Feedback corto del jugador al equipo de sanidad sobre cómo se viene
// sintiendo. Texto libre, máximo 60 caracteres, con su propio historial.
function FeedbackSection({ injury, col, toast }) {
  const [text, setText] = useState('');
  const feedbackQ = useInjuryFeedback();
  const addFeedback = useAddInjuryFeedback();
  const deleteFeedback = useDeleteInjuryFeedback();

  const mine = feedbackForInjury(feedbackQ.data, injury.id);

  function send() {
    const t = text.trim();
    if (!t) return;
    addFeedback.mutate({ injuryId: injury.id, playerId: injury.player_id, text: t }, {
      onSuccess: () => setText(''),
      onError: () => toast?.('No se pudo enviar'),
    });
  }

  return (
    <div style={{ borderTop: `1.5px solid ${col}33`, paddingTop: 12, marginTop: 12 }}>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="chat" size={13} color={CC.muted} sw={2.3} />Contale a sanidad cómo te sentís
      </div>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, FEEDBACK_MAX))}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Ej: hoy sentí menos dolor al correr"
          style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 11, padding: '10px 11px', fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, background: '#fff' }}
        />
        <button onClick={send} disabled={!text.trim() || addFeedback.isPending} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: text.trim() ? col : 'rgba(14,58,92,0.15)', color: '#fff', borderRadius: 11, padding: '10px 13px', cursor: text.trim() ? 'pointer' : 'default', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>
          <Icon name="send" size={15} color="#fff" sw={2.4} />
        </button>
      </div>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint, marginTop: 4, textAlign: 'right' }}>{text.length}/{FEEDBACK_MAX}</div>

      {mine.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {mine.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${CC.line}`, borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.ink, lineHeight: 1.3 }}>{f.text}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint, marginTop: 2 }}>{fmtDateTime(f.created_at)}</div>
              </div>
              <button onClick={() => deleteFeedback.mutate(f.id)} title="Eliminar" style={{ width: 22, height: 22, borderRadius: 7, border: 'none', background: 'rgba(224,82,78,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="x" size={11} color={CC.bad} sw={2.6} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Ficha de lesión del jugador (perfil / Sanidad propia): desplegable, muestra
// diagnóstico, retorno estimado y los protocolos de recuperación cargados por
// fisioterapia. Solo lectura — la carga la hace el admin desde Sanidad. El
// jugador sí puede dejar feedback corto de cómo se viene sintiendo.
export function InjuryCard({ injury, protocols = [], toast }) {
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
            <FeedbackSection injury={injury} col={col} toast={toast} />
          </div>
        </div>
      )}
    </div>
  );
}
