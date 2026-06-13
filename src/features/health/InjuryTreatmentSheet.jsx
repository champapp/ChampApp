import { useState } from 'react';
import { CC, Icon, Field, TextInput } from '../../ui';
import { todayISO } from '../../lib/domain';
import { useSetInjury, useCloseInjury, useAddInjuryProtocol, useDeleteInjuryProtocol } from '../../lib/queries';
import { ProtocolItem } from '../../components/player/ProtocolItem';

// Tratamiento (admin): carga/edita diagnóstico y retorno de una lesión, y
// gestiona sus protocolos de recuperación. Si `injury` es null, registra una
// lesión nueva (los protocolos se cargan después, una vez guardada).
export function InjuryTreatmentSheet({ player, injury, protocols = [], onClose, toast }) {
  const [diag, setDiag] = useState(injury ? injury.reason || '' : '');
  const [ret, setRet] = useState(injury ? injury.return_date || '' : '');
  const [txt, setTxt] = useState('');

  const setInjuryMutation = useSetInjury();
  const closeInjuryMutation = useCloseInjury();
  const addProtocolMutation = useAddInjuryProtocol();
  const deleteProtocolMutation = useDeleteInjuryProtocol();

  function save() {
    if (!ret) { toast && toast('Indicá la fecha de retorno a la cancha'); return; }
    const payload = injury
      ? { id: injury.id, reason: diag.trim(), return_date: ret }
      : { player_id: player.id, reason: diag.trim(), return_date: ret, since: todayISO() };
    setInjuryMutation.mutate(payload, {
      onSuccess: () => { onClose(); toast && toast('Tratamiento guardado'); },
      onError: () => toast && toast('No se pudo guardar el tratamiento'),
    });
  }
  function discharge() {
    closeInjuryMutation.mutate(injury.id, {
      onSuccess: () => { onClose(); toast && toast((player.name.split(' ')[0]) + ' dado de alta'); },
      onError: () => toast && toast('No se pudo dar de alta'),
    });
  }
  function addProto() {
    const t = txt.trim();
    if (!t || !injury) return;
    addProtocolMutation.mutate({ injuryId: injury.id, text: t }, {
      onSuccess: () => setTxt(''),
      onError: () => toast && toast('No se pudo agregar el protocolo'),
    });
  }
  function delProto(id) {
    deleteProtocolMutation.mutate(id, {
      onError: () => toast && toast('No se pudo eliminar el protocolo'),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 360, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.bad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="medkit" size={20} color="#fff" sw={2.3} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Tratamiento</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name} · {player.cat}{player.sub ? ' ' + player.sub : ''}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Diagnóstico">
            <textarea value={diag} onChange={(e) => setDiag(e.target.value)} rows={2} placeholder="Ej: Esguince de tobillo grado I (ligamento lateral externo)" style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 11, padding: '11px 12px', fontFamily: 'Barlow, sans-serif', fontSize: 15, color: CC.ink, background: '#fff', resize: 'none', lineHeight: 1.35 }} />
          </Field>
          <Field label="Fecha de retorno a la cancha">
            <TextInput type="date" value={ret} onChange={(e) => setRet(e.target.value)} />
          </Field>

          {injury ? (
            <div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="medkit" size={13} color={CC.muted} sw={2.3} />Protocolos de recuperación
              </div>
              {protocols.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 9 }}>
                  {protocols.map((pr) => <ProtocolItem key={pr.id} pr={pr} onDelete={delProto} />)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={2} placeholder="Indicación (ej: crioterapia 3x/día, propiocepción en plato…)" style={{ flex: 1, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 11, padding: '9px 11px', fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, background: '#fff', resize: 'none', lineHeight: 1.35 }} />
                <button onClick={addProto} disabled={!txt.trim()} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: txt.trim() ? CC.navy : 'rgba(14,58,92,0.2)', color: '#fff', borderRadius: 11, padding: '10px 13px', cursor: txt.trim() ? 'pointer' : 'default', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}>
                  <Icon name="plus" size={16} color="#fff" sw={2.6} />Agregar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: 'rgba(14,58,92,0.04)', borderRadius: 11, padding: '10px 12px' }}>
              <Icon name="alert" size={14} color={CC.muted} sw={2.3} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, lineHeight: 1.4 }}>Guardá el tratamiento para poder agregar protocolos de recuperación.</span>
            </div>
          )}

          {injury && (
            <button onClick={discharge} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, border: `1.5px solid ${CC.good}`, background: 'rgba(30,158,106,0.07)', color: CC.good, borderRadius: 11, padding: '9px 13px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>
              <Icon name="check" size={15} color={CC.good} sw={2.6} />Dar de alta (recuperado)
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: 'rgba(14,58,92,0.04)', borderRadius: 11, padding: '10px 12px' }}>
            <Icon name="alert" size={14} color={CC.muted} sw={2.3} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, lineHeight: 1.4 }}>Lo que cargues acá se refleja en <b>Sanidad</b> (panel del administrador) y en la <b>alerta de lesión</b> del perfil del jugador.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={save} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />Guardar tratamiento
          </button>
        </div>
      </div>
    </div>
  );
}
