import { useState } from 'react';
import { CC, Icon, Card, Avatar, SectionTitle, Toast, fmtDate } from '../../ui';
import { injuryStatus, injuredPlayers, protocolsForInjury, catById } from '../../lib/domain';
import { usePlayers, useActiveInjuries, useInjuryProtocols } from '../../lib/queries';
import { useToast } from '../../lib/useToast';
import { ProtocolItem } from '../../components/player/ProtocolItem';
import { FisioAgenda } from './FisioAgenda';
import { InjuryTreatmentSheet } from './InjuryTreatmentSheet';
import { NewInjuryPicker } from './NewInjuryPicker';
import { InjuryStats } from './InjuryStats';

// Fila de un jugador lesionado: diagnóstico, retorno y protocolos (lectura),
// con acceso al tratamiento completo.
function SanidadRow({ player, injury, protocols, onTreat }) {
  const st = injuryStatus(injury);
  const [exp, setExp] = useState(false);
  if (!st) return null;
  const red = st.color === 'red';
  const col = red ? CC.bad : CC.gold;

  return (
    <div style={{ border: `1px solid ${CC.line}`, borderRadius: 14, background: '#fff', overflow: 'hidden' }}>
      <button onClick={() => setExp((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <Avatar name={player.name} photo={player.photo_url} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 15, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.reason || 'Lesión sin diagnóstico cargado'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: red ? 'rgba(224,82,78,0.1)' : 'rgba(249,178,51,0.16)', color: col, borderRadius: 999, padding: '3px 9px' }}>
            <Icon name="clock" size={12} color={col} sw={2.5} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>{st.days <= 0 ? 'vuelve hoy' : st.days + (st.days === 1 ? ' día' : ' días')}</span>
          </span>
          {protocols.length > 0 && <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint, fontWeight: 600 }}>{protocols.length} protocolo{protocols.length > 1 ? 's' : ''}</span>}
        </div>
        <Icon name={exp ? 'chevUp' : 'chevron'} size={17} color={CC.faint} sw={2.3} />
      </button>

      {exp && (
        <div style={{ padding: '0 11px 12px', borderTop: `1px solid ${CC.line}` }}>
          <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
            <div style={{ flex: 1, background: 'rgba(14,58,92,0.04)', borderRadius: 11, padding: '9px 11px' }}>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>Diagnóstico</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, marginTop: 3, lineHeight: 1.35 }}>{st.reason || '—'}</div>
            </div>
            <div style={{ width: 124, flexShrink: 0, background: red ? 'rgba(224,82,78,0.07)' : 'rgba(249,178,51,0.1)', borderRadius: 11, padding: '9px 11px' }}>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>Vuelve a la cancha</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: col, marginTop: 2, lineHeight: 1.1 }}>{fmtDate(st.returnDate)}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted }}>{st.days <= 0 ? 'estimado hoy' : 'en ' + st.days + (st.days === 1 ? ' día' : ' días')}</div>
            </div>
          </div>

          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', margin: '13px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="medkit" size={13} color={CC.muted} sw={2.3} />Protocolos de recuperación
          </div>
          {protocols.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {protocols.map((pr) => <ProtocolItem key={pr.id} pr={pr} />)}
            </div>
          ) : (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, background: CC.paper, border: `1px dashed ${CC.line}`, borderRadius: 11, padding: '11px 12px', textAlign: 'center' }}>Todavía no cargaste protocolos para esta lesión.</div>
          )}
          <button onClick={() => onTreat(player, injury)} style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: CC.navy, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, letterSpacing: 0.3, padding: 0 }}>
            <Icon name="medkit" size={15} color={CC.navy} sw={2.4} />Tratamiento<Icon name="chevron" size={15} color={CC.navy} sw={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

// Sanidad (admin): jugadores en recuperación por categoría, agenda de fisio
// y carga de tratamientos/protocolos.
export function AdminHealthScreen() {
  const [toast, showToast] = useToast();
  const playersQ = usePlayers();
  const injuriesQ = useActiveInjuries();
  const protocolsQ = useInjuryProtocols();
  const [treat, setTreat] = useState(null); // { player, injury }
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState(true);

  if (playersQ.isLoading || injuriesQ.isLoading || protocolsQ.isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>;
  }

  const players = playersQ.data ?? [];
  const allProtocols = protocolsQ.data ?? [];
  const injuryByPlayer = new Map((injuriesQ.data ?? []).map((i) => [i.player_id, i]));
  const injured = injuredPlayers({ players, injuryByPlayer });
  const n = injured.length;

  const groups = [];
  injured.forEach((p) => {
    let g = groups.find((x) => x.cat === p.cat);
    if (!g) { g = { cat: p.cat, list: [] }; groups.push(g); }
    g.list.push(p);
  });

  function openTreatment(player, injury) {
    setTreat({ player, injury: injury || injuryByPlayer.get(player.id) || null });
  }

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="medkit">Sanidad</SectionTitle>

      <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
        <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: n ? 'rgba(224,82,78,0.12)' : 'rgba(30,158,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <Icon name="medkit" size={20} color={n ? CC.bad : CC.good} sw={2.2} />
            {n > 0 && <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: CC.bad, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxSizing: 'content-box' }}>{n}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Jugadores en recuperación</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: n ? CC.bad : CC.muted, marginTop: 3 }}>{n ? `${n} jugador${n > 1 ? 'es' : ''} en recuperación` : 'Plantel sano · sin lesionados'}</div>
          </div>
          <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
        </button>

        {open && (
          <div style={{ padding: '0 14px 14px' }}>
            {n === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 10px 12px' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(30,158,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 9px' }}>
                  <Icon name="check" size={24} color={CC.good} sw={2.4} />
                </div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.muted }}>No hay jugadores lesionados en este momento.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
                {groups.map((g) => {
                  const meta = catById(g.cat);
                  return (
                    <div key={g.cat}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, letterSpacing: 0.5, color: CC.navy900, background: CC.gold, padding: '2px 9px', borderRadius: 6 }}>{g.cat}</span>
                        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted }}>{meta ? meta.full : ''} · {g.list.length} lesionado{g.list.length > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {g.list.map((p) => (
                          <SanidadRow key={p.id} player={p} injury={injuryByPlayer.get(p.id)} protocols={protocolsForInjury(allProtocols, injuryByPlayer.get(p.id)?.id)} onTreat={openTreatment} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => setPicking(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px dashed ${CC.navy}`, background: 'rgba(14,58,92,0.03)', color: CC.navy, padding: '12px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>
              <Icon name="plus" size={16} color={CC.navy} sw={2.7} />Nueva lesión
            </button>
          </div>
        )}
      </Card>

      <FisioAgenda mode="admin" injuryByPlayer={injuryByPlayer} onOpenTreatment={openTreatment} toast={showToast} />
      <InjuryStats />

      {picking && (
        <NewInjuryPicker
          players={players}
          injuryByPlayer={injuryByPlayer}
          onPick={(p) => { setPicking(false); openTreatment(p, null); }}
          onClose={() => setPicking(false)}
        />
      )}
      {treat && (
        <InjuryTreatmentSheet
          player={treat.player}
          injury={treat.injury}
          protocols={treat.injury ? protocolsForInjury(allProtocols, treat.injury.id) : []}
          onClose={() => setTreat(null)}
          toast={showToast}
        />
      )}

      <Toast msg={toast} />
    </div>
  );
}
