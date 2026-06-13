import { useState } from 'react';
import { CC, Icon, Avatar, Field, TextInput, SelectInput, matchLongDate, matchLabelShort } from '../../../ui';
import { CATS, POSITIONS, playerById, nextMatch, matchesForCat, matchTimeLabel, todayISO } from '../../../lib/domain';
import { usePlayers, useMatches, useUpsertLineup } from '../../../lib/queries';
import { LineupPlayerPicker } from './LineupPlayerPicker';

const LINEUP_MAX = 23;
const SUBS = Array.from({ length: 8 }, (_, i) => ({ dorsal: 16 + i, pos: 'Suplente ' + (i + 1), short: 'Suplente', type: i < 5 ? 'Forward' : 'Back' }));

// fila de un puesto en el editor de alineación
function LineupSlotRow({ players, dorsal, label, type, playerId, onTap }) {
  const p = playerId ? playerById(players, playerId) : null;
  const typeColor = type === 'Forward' ? CC.navy : CC.goldDeep;
  return (
    <button onClick={onTap} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', border: `1.5px solid ${p ? 'rgba(14,58,92,0.18)' : CC.line}`, background: p ? '#fff' : 'rgba(14,58,92,0.02)', borderRadius: 12, padding: '8px 11px', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: p ? typeColor : 'rgba(14,58,92,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: p ? '#fff' : CC.faint }}>{dorsal}</span>
      </div>
      <div style={{ width: 92, flexShrink: 0, fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, color: CC.muted, letterSpacing: 0.2, lineHeight: 1.1 }}>{label}</div>
      {p ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <Avatar name={p.name} photo={p.photo_url} size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            {p.cat && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint }}>{p.cat}{p.sub ? ' ' + p.sub : ''}</div>}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5, color: CC.faint, letterSpacing: 0.3 }}>Asignar jugador</div>
      )}
      <Icon name={p ? 'edit' : 'plus'} size={15} color={CC.navy} sw={2.4} />
    </button>
  );
}

// Crear / editar una alineación.
export function LineupBuilder({ initial, onClose, toast }) {
  const playersQ = usePlayers();
  const matchesQ = useMatches();
  const upsertLineup = useUpsertLineup();

  const [name, setName] = useState(initial ? initial.name : 'Titular');
  const [cat, setCat] = useState(initial ? initial.cat : '');
  const [matchId, setMatchId] = useState(initial ? initial.match_id : null);
  const [picks, setPicks] = useState(initial ? { ...initial.positions } : {});
  const [picking, setPicking] = useState(null); // {dorsal, label}

  if (playersQ.isLoading || matchesQ.isLoading) return null;

  const players = playersQ.data;
  const catMatches = cat ? matchesForCat(matchesQ.data, cat).filter((m) => m.date >= todayISO()) : [];
  const match = matchId ? matchesQ.data.find((m) => m.id === matchId) : null;
  const count = Object.values(picks).filter(Boolean).length;
  const usedMap = {};
  Object.values(picks).forEach((pid) => { if (pid) usedMap[pid] = true; });

  function assign(dorsal, pid) {
    setPicks((pr) => {
      const np = { ...pr };
      // quitar al jugador de cualquier otro puesto
      Object.keys(np).forEach((k) => { if (np[k] === pid) delete np[k]; });
      np[dorsal] = pid;
      return np;
    });
    setPicking(null);
  }
  function clear(dorsal) {
    setPicks((pr) => { const np = { ...pr }; delete np[dorsal]; return np; });
    setPicking(null);
  }

  function selectCat(newCat) {
    setCat(newCat);
    const def = newCat ? nextMatch({ matches: matchesQ.data, cat: newCat }) : null;
    setMatchId(def ? def.id : null);
  }

  function save() {
    if (!cat) { toast('Elegí la categoría'); return; }
    if (!matchId) { toast('Elegí el partido'); return; }
    if (count === 0) { toast('Asigná al menos un jugador'); return; }
    upsertLineup.mutate(
      { id: initial ? initial.id : undefined, name: name.trim() || 'Alineación', cat, matchId, positions: picks },
      {
        onSuccess: () => { onClose(); toast(initial ? 'Alineación actualizada' : 'Alineación publicada ✓'); },
        onError: () => toast('No se pudo guardar. Probá de nuevo.'),
      },
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="players" size={20} color="#fff" sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{initial ? 'Editar alineación' : 'Nueva alineación'}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>{count} / {LINEUP_MAX} jugadores</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre de la alineación"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Titular, Equipo B" /></Field>
          <Field label="Categoría que juega">
            <SelectInput value={cat} onChange={(e) => selectCat(e.target.value)}>
              <option value="">Elegí una categoría…</option>
              {CATS.filter((c) => players.some((p) => p.cat === c.id)).map((c) => <option key={c.id} value={c.id}>{c.id} · {c.full}</option>)}
            </SelectInput>
          </Field>

          {cat && (catMatches.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(224,82,78,0.07)', border: `1.5px solid ${CC.bad}`, borderRadius: 12, padding: '11px 13px' }}>
              <Icon name="alert" size={17} color={CC.bad} sw={2.4} />
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink }}>Esta categoría no tiene partidos próximos cargados. Creá el partido primero.</span>
            </div>
          ) : (
            <>
              <Field label="Partido">
                <SelectInput value={matchId ?? ''} onChange={(e) => setMatchId(e.target.value ? Number(e.target.value) : null)}>
                  {catMatches.map((m) => <option key={m.id} value={m.id}>{matchLabelShort(m)} · {matchLongDate(m.date)}</option>)}
                </SelectInput>
              </Field>
              {match && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: `linear-gradient(150deg, ${CC.navy}, ${CC.navy900})`, borderRadius: 14, padding: '11px 13px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="whistle" size={18} color={CC.gold} sw={2.2} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Partido elegido</div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', lineHeight: 1.05 }}>{matchLabelShort(match)}</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>{matchLongDate(match.date)}{matchTimeLabel(match) ? ' · ' + matchTimeLabel(match) : ''}</div>
                  </div>
                </div>
              )}
            </>
          ))}

          {cat && match && (
            <>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: CC.muted, textTransform: 'uppercase', marginTop: 2 }}>Titulares (1–15)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {POSITIONS.map((s) => <LineupSlotRow key={s.dorsal} players={players} dorsal={s.dorsal} label={s.pos} type={s.type} playerId={picks[s.dorsal]} onTap={() => setPicking({ dorsal: s.dorsal, label: '#' + s.dorsal + ' · ' + s.pos })} />)}
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: CC.muted, textTransform: 'uppercase', marginTop: 6 }}>Suplentes (16–23)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {SUBS.map((s) => <LineupSlotRow key={s.dorsal} players={players} dorsal={s.dorsal} label={s.pos} type={s.type} playerId={picks[s.dorsal]} onTap={() => setPicking({ dorsal: s.dorsal, label: '#' + s.dorsal + ' · ' + s.pos })} />)}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={save} disabled={upsertLineup.isPending} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: upsertLineup.isPending ? 0.7 : 1 }}><Icon name="check" size={18} color={CC.navy900} sw={2.6} />{initial ? 'Guardar' : 'Publicar equipo'}</button>
        </div>
      </div>
      {picking && <LineupPlayerPicker cat={cat} used={usedMap} slotLabel={picking.label} onPick={(pid) => assign(picking.dorsal, pid)} onClear={picks[picking.dorsal] ? () => clear(picking.dorsal) : null} onClose={() => setPicking(null)} />}
    </div>
  );
}
