import { useState } from 'react';
import { CC, Icon, Card, Avatar, SectionTitle, Ring, Empty, Toast, fmtPct, fmtDate, rateColor } from '../../ui';
import { InjuryBadge } from '../../components/player/InjuryBadge';
import { ageFromBirth, playerAttendance, nextMatch, latestGymMarks } from '../../lib/domain';
import {
  usePlayers, usePractices, useAttendance, useMatches, useRsvp, useGymChecks, useGymMarks, usePlayerInjury, useUpdatePlayer, useAdminDocs, usePlayerPin,
} from '../../lib/queries';
import { useToast } from '../../lib/useToast';
import { EditPlayerSheet } from './EditPlayerSheet';
import { PlayerGallery } from './PlayerGallery';
import { MeasurementsCard } from './MeasurementsCard';
import { MatchRecord } from './MatchRecord';
import { PhysCard } from './PhysCard';
import { NextMatchCard } from '../matches/NextMatchCard';
import { PlayerMatchRsvp } from '../matches/PlayerMatchRsvp';
import { GymEditButton } from '../gym/GymEditButton';
import { AdminDocsCard } from './AdminDocsCard';
import { DocExpiryBanner } from '../../components/player/DocExpiryBanner';

function BackButton({ onBack }) {
  return (
    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: '7px 12px 7px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.4 }}>
      <Icon name="back" size={17} sw={2.5} />Volver
    </button>
  );
}

function ProfileLoading({ onBack }) {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ background: `linear-gradient(160deg, ${CC.navy}, ${CC.navy900})`, padding: '8px 16px 22px', color: '#fff' }}>
        <BackButton onBack={onBack} />
      </div>
      <div style={{ padding: 16 }}>
        <Card><div style={{ fontFamily: 'Barlow, sans-serif', color: CC.muted, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Cargando perfil…</div></Card>
      </div>
    </div>
  );
}

// Perfil de un jugador (vista admin). Cubre identidad, asistencia, datos
// físicos/objetivo y documentación administrativa. Próximo partido, lesión,
// RSVP y mediciones de gimnasio se agregan en sus respectivas fases.
export function PlayerProfileScreen({ playerId, onBack }) {
  const [toast, showToast] = useToast();
  const [editPhys, setEditPhys] = useState(false);
  const [editing, setEditing] = useState(false);
  const [phys, setPhys] = useState(null);
  const [showPin, setShowPin] = useState(false);

  const playersQ = usePlayers();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const gymChecksQ = useGymChecks();
  const gymMarksQ = useGymMarks();
  const injuryQ = usePlayerInjury(playerId);
  const adminDocsQ = useAdminDocs(playerId);
  const pinQ = usePlayerPin(playerId);
  const updateMutation = useUpdatePlayer();

  const queries = [playersQ, practicesQ, attendanceQ, matchesQ, rsvpQ, gymChecksQ, gymMarksQ, injuryQ, adminDocsQ];
  if (queries.some((x) => x.isLoading)) return <ProfileLoading onBack={onBack} />;

  const p = (playersQ.data ?? []).find((x) => x.id === playerId);
  if (!p) return <ProfileLoading onBack={onBack} />;

  const att = playerAttendance({
    practices: practicesQ.data ?? [], attendance: attendanceQ.data ?? [],
    matches: matchesQ.data ?? [], rsvp: rsvpQ.data ?? [], gymChecks: gymChecksQ.data ?? [], player: p,
  });
  const next = nextMatch({ matches: matchesQ.data ?? [], cat: p.cat, sub: p.sub });
  const age = ageFromBirth(p);
  const view = editPhys && phys ? phys : { peso: p.peso, talla: p.talla };
  const imc = view.peso && view.talla ? Math.round((view.peso / Math.pow(view.talla / 100, 2)) * 10) / 10 : p.imc;
  const imcCat = imc == null ? null : imc < 18.5 ? 'Bajo' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Alto';
  const imcColor = imc != null && imc >= 18.5 && imc < 27 ? CC.good : CC.gold;

  function startEditPhys() {
    setPhys({ peso: p.peso, talla: p.talla });
    setEditPhys(true);
  }
  function savePhys() {
    const peso = phys.peso;
    const talla = phys.talla;
    const newImc = peso && talla ? Math.round((peso / Math.pow(talla / 100, 2)) * 10) / 10 : null;
    updateMutation.mutate({ id: p.id, patch: { peso, talla, imc: newImc } }, {
      onSuccess: () => { setEditPhys(false); showToast('Datos actualizados'); },
      onError: () => showToast('No se pudo guardar'),
    });
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* header navy */}
      <div style={{ background: `linear-gradient(160deg, ${CC.navy}, ${CC.navy900})`, padding: '8px 16px 22px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <BackButton onBack={onBack} />
          <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: CC.gold, border: 'none', color: CC.navy900, padding: '7px 13px 7px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.3 }}>
            <Icon name="edit" size={15} color={CC.navy900} sw={2.4} />Editar perfil
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={p.name} photo={p.photo_url} size={84} ring={CC.gold} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1.05, display: 'flex', alignItems: 'center', gap: 9 }}>
              <span>{p.name}</span><InjuryBadge injury={injuryQ.data} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.5, color: CC.navy900, background: CC.gold, padding: '3px 9px', borderRadius: 6 }}>{p.cat}{p.sub ? ' · ' + p.sub : ''}</span>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {age != null ? `${age} años` : ''}{age != null && p.birth_year ? ' · ' : ''}{p.birth_year || ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', padding: '3px 9px', borderRadius: 6 }}>
                <Icon name="players" size={13} color={CC.gold} sw={2.2} />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: '#fff', letterSpacing: 0.3 }}>{p.username}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', padding: '3px 9px', borderRadius: 6 }}>
                <Icon name="lock" size={13} color={CC.gold} sw={2.2} />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: '#fff', letterSpacing: 0.3, minWidth: 30, display: 'inline-block' }}>{showPin ? (pinQ.data || '----') : '••••'}</span>
                <button onClick={() => setShowPin((s) => !s)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: CC.gold, padding: 0, display: 'flex' }} aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}>
                  <Icon name={showPin ? 'eyeOff' : 'eye'} size={13} sw={2.2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocExpiryBanner docs={adminDocsQ.data} />

      <div style={{ padding: '16px 16px 0' }}>
        {/* próximo partido */}
        <NextMatchCard match={next} player={p} />

        {/* encuesta de asistencia (vista admin) */}
        <PlayerMatchRsvp player={p} />

        {/* récord de partidos */}
        <MatchRecord player={p} matches={matchesQ.data ?? []} />

        {/* asistencia */}
        <Card pad={14} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Ring value={att.rate} size={64} stroke={8} color={rateColor(att.rate)} track="rgba(14,58,92,0.08)">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink }}>{fmtPct(att.rate)}</div>
          </Ring>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>Asistencia</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted, marginTop: 2 }}>{att.present} presentes de {att.total} prácticas registradas</div>
          </div>
        </Card>

        {/* documentación administrativa */}
        <AdminDocsCard player={p} canEdit toast={showToast} />

        {/* datos físicos */}
        <SectionTitle icon="ruler" action={(
          <button onClick={() => (editPhys ? savePhys() : startEditPhys())} style={{ border: 'none', background: editPhys ? CC.gold : 'rgba(14,58,92,0.06)', color: editPhys ? CC.navy900 : CC.navy, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name={editPhys ? 'check' : 'edit'} size={14} sw={2.4} />{editPhys ? 'Guardar' : 'Editar'}
          </button>
        )}>Datos físicos</SectionTitle>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <PhysCard label="Peso" unit="kg" value={view.peso} edit={editPhys} onChange={(v) => setPhys((s) => ({ ...s, peso: v }))} />
          <PhysCard label="Talla" unit="cm" value={view.talla} edit={editPhys} onChange={(v) => setPhys((s) => ({ ...s, talla: v }))} />
          <div style={{ flex: 1, background: '#fff', borderRadius: 16, padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 2px rgba(14,34,53,0.04), 0 6px 20px rgba(14,34,53,0.05)' }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: CC.ink, lineHeight: 1 }}>{imc ?? '—'}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted, fontWeight: 600, letterSpacing: 0.4, marginTop: 3 }}>IMC</div>
            {imcCat && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: imcColor, fontWeight: 700, marginTop: 3 }}>{imcCat}</div>}
          </div>
        </div>

        {/* objetivo */}
        {p.objetivo && (
          <Card pad={14} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(249,178,51,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="target" size={20} color={CC.goldDeep} /></div>
            <div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase' }}>Objetivo de gimnasio</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 15.5, color: CC.ink, marginTop: 1 }}>{p.objetivo}</div>
            </div>
          </Card>
        )}

        {/* mediciones de gimnasio */}
        <SectionTitle icon="weight" action={<GymEditButton player={p} marks={gymMarksQ.data ?? []} toast={showToast} />}>Mediciones de gimnasio</SectionTitle>
        {(() => {
          const latest = latestGymMarks(gymMarksQ.data ?? [], p.id);
          const exercises = Object.keys(latest);
          if (!exercises.length) return <Card pad={14} style={{ marginBottom: 16 }}><Empty t="Sin mediciones cargadas" /></Card>;
          return (
            <Card pad={16} style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {exercises.map((ex) => {
                  const m = latest[ex];
                  return (
                    <div key={ex} style={{ background: CC.paper, borderRadius: 12, padding: '10px 11px' }}>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 11.5, color: CC.muted, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: CC.navy, lineHeight: 0.9 }}>{m.value}</span>
                        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted, fontWeight: 600 }}>{m.unit}</span>
                      </div>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: CC.faint, marginTop: 3 }}>{fmtDate(m.date)}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}
      </div>

      <div style={{ padding: '0 16px' }}>
        <MeasurementsCard player={p} admin />
        <PlayerGallery player={p} isAdmin toast={showToast} />
      </div>

      {editing && (
        <EditPlayerSheet
          player={p}
          onClose={() => setEditing(false)}
          onDeleted={onBack}
          toast={showToast}
        />
      )}
      <Toast msg={toast} />
    </div>
  );
}
