import { useState } from 'react';
import { CC, Icon, Card } from '../../ui';
import { gymBlocksDone, routineCats, todayISO } from '../../lib/domain';
import { useAddGymCheck } from '../../lib/queries';

// colores por sección de la planilla
const SECTION_TONES = {
  CALENTAMIENTO: { bg: 'rgba(14,58,92,0.07)', fg: CC.navy },
  POTENCIA: { bg: CC.navy, fg: '#fff' },
  HIPERTROFIA: { bg: CC.gold, fg: CC.navy900 },
  'FÍSICO': { bg: 'rgba(30,158,106,0.15)', fg: CC.good },
  FISICO: { bg: 'rgba(30,158,106,0.15)', fg: CC.good },
  CONDICIONER: { bg: 'rgba(30,158,106,0.15)', fg: CC.good },
};

function DetailChip({ label, value, strong }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: strong ? 'rgba(249,178,51,0.14)' : CC.paper, borderRadius: 8, padding: '4px 9px', minWidth: 54 }}>
      <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 8.5, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, color: strong ? CC.goldDeep : CC.ink, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// agrupa los ejercicios de un bloque por sección consecutiva (POTENCIA, HIPERTROFIA, FÍSICO…)
function groupBySection(exercises) {
  const groups = [];
  (exercises || []).forEach((ex) => {
    const sec = (ex.section || '').toUpperCase();
    const last = groups[groups.length - 1];
    if (last && last.sec === sec) last.items.push(ex);
    else groups.push({ sec, items: [ex] });
  });
  return groups;
}

// Una rutina asignada al jugador: bloques (días) con sus ejercicios y el check
// de "completé este día" que registra su asistencia al gimnasio.
export function RoutineView({ routine, player, gymChecks, toast }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(null); // índice del bloque a confirmar
  const addCheck = useAddGymCheck();

  const blocksDone = gymBlocksDone(gymChecks, player.id, routine.id);
  const blocks = routine.blocks || [];
  const nBlocks = blocks.length;
  const nEx = blocks.reduce((a, b) => a + (b.exercises || []).length, 0);
  const cats = routineCats(routine);

  function complete(bi) {
    addCheck.mutate({ playerId: player.id, routineId: routine.id, block: bi, date: todayISO() }, {
      onSuccess: () => { setConfirming(null); toast('Asistencia al gym registrada ✓'); },
      onError: () => toast('No se pudo guardar. Probá de nuevo.'),
    });
  }

  return (
    <Card pad={0} style={{ overflow: 'hidden', marginBottom: 12 }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="weight" size={20} color={CC.navy} sw={2.1} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, lineHeight: 1.05 }}>{routine.title}</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>
            {nBlocks} {nBlocks === 1 ? 'bloque' : 'bloques'} · {nEx} ejercicios{cats.includes('all') ? '' : ' · ' + cats.join(', ')}
          </div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {routine.note && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted, lineHeight: 1.4, marginBottom: 12, background: CC.paper, borderRadius: 10, padding: '9px 11px' }}>{routine.note}</div>}
          {blocks.map((b, i) => {
            const done = !!(blocksDone[i] || blocksDone.all);
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', background: done ? CC.good : CC.navy, borderRadius: 6, padding: '3px 9px', letterSpacing: 0.3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {done && <Icon name="check" size={11} color="#fff" sw={3} />}{b.title || 'Bloque ' + (i + 1)}
                  </span>
                  {done && <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.good, fontWeight: 700 }}>Completado</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {groupBySection(b.exercises).map((g, gi) => {
                    const tone = SECTION_TONES[g.sec] || { bg: 'rgba(14,58,92,0.07)', fg: CC.navy };
                    return (
                      <div key={gi}>
                        {g.sec && <div style={{ display: 'inline-block', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 0.8, color: tone.fg, background: tone.bg, borderRadius: 6, padding: '3px 9px', textTransform: 'uppercase', margin: '4px 0 6px' }}>{g.sec}</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {g.items.map((ex, j) => {
                            const hasMeta = ex.aprox || ex.detail || ex.rest;
                            return (
                              <div key={j} style={{ background: '#fff', border: `1px solid ${CC.line}`, borderRadius: 10, padding: '9px 12px' }}>
                                <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink, lineHeight: 1.3 }}>{ex.name}</div>
                                {hasMeta && (
                                  <div style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
                                    <DetailChip label="Aprox." value={ex.aprox} />
                                    <DetailChip label="Set / Rep" value={ex.detail} strong />
                                    <DetailChip label="Descanso" value={ex.rest} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* check de asistencia por día */}
                {!done && (
                  confirming === i ? (
                    <div style={{ background: 'rgba(30,158,106,0.07)', border: `1.5px solid ${CC.good}`, borderRadius: 13, padding: '11px 12px', marginTop: 8 }}>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, lineHeight: 1.4 }}>¿Confirmás que completaste <b>{b.title || 'este día'}</b> hoy? Se marca tu <b>asistencia al gym</b> en el calendario.</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
                        <button onClick={() => setConfirming(null)} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.muted, padding: '9px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}>No, volver</button>
                        <button onClick={() => complete(i)} disabled={addCheck.isPending} style={{ flex: 1.4, border: 'none', background: CC.good, color: '#fff', padding: '9px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: addCheck.isPending ? 0.7 : 1 }}><Icon name="check" size={15} color="#fff" sw={2.6} />Sí, lo completé</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirming(i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1.5px solid ${CC.good}`, background: 'rgba(30,158,106,0.06)', color: CC.good, padding: '10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.3, marginTop: 8 }}>
                      <Icon name="check" size={16} color={CC.good} sw={2.6} />Completé {b.title || 'este día'} hoy
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
