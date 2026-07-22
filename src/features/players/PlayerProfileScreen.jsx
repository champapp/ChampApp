import { useState } from 'react';
import { CC, Icon, Card, Avatar, SectionTitle, Ring, Empty, Toast, fmtPct, fmtDate, rateColor } from '../../ui';
import { InjuryBadge } from '../../components/player/InjuryBadge';
import { StreakCard } from '../../components/player/StreakCard';
import { MonthlySummaryCard } from '../../components/player/MonthlySummaryCard';
import { ageFromBirth, playerAttendance, nextMatch, latestGymMarks, playerHistory, todayISO } from '../../lib/domain';
import {
  usePlayers, usePractices, useAttendance, useMatches, useRsvp, useGymChecks, useGymMarks, useRoutines, usePlayerInjury, useUpdatePlayer, useAdminDocs, usePlayerPin,
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

function waUrl(str) {
  if (!str) return null;
  const digits = str.replace(/\D/g, '');
  if (digits.length < 7) return null;
  const normalized = digits.startsWith('598') ? digits : '598' + digits.replace(/^0/, '');
  return `https://wa.me/${normalized}`;
}

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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);

  const playersQ = usePlayers();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const gymChecksQ = useGymChecks();
  const gymMarksQ = useGymMarks();
  const routinesQ = useRoutines();
  const injuryQ = usePlayerInjury(playerId);
  const adminDocsQ = useAdminDocs(playerId);
  const pinQ = usePlayerPin(playerId);
  const updateMutation = useUpdatePlayer();

  const queries = [playersQ, practicesQ, attendanceQ, matchesQ, rsvpQ, gymChecksQ, gymMarksQ, routinesQ, injuryQ, adminDocsQ];
  if (queries.some((x) => x.isLoading)) return <ProfileLoading onBack={onBack} />;

  const p = (playersQ.data ?? []).find((x) => x.id === playerId);
  if (!p) return <ProfileLoading onBack={onBack} />;

  const att = playerAttendance({
    practices: practicesQ.data ?? [], attendance: attendanceQ.data ?? [],
    matches: matchesQ.data ?? [], rsvp: rsvpQ.data ?? [], gymChecks: gymChecksQ.data ?? [], player: p,
  });
  const history = playerHistory({ practices: practicesQ.data ?? [], attendance: attendanceQ.data ?? [], matches: matchesQ.data ?? [], rsvp: rsvpQ.data ?? [], gymChecks: gymChecksQ.data ?? [], player: p });
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
          <button onClick={() => p.photo_url && setAvatarOpen(true)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: p.photo_url ? 'pointer' : 'default', display: 'flex', borderRadius: '50%' }}>
            <Avatar name={p.name} photo={p.photo_url} size={84} ring={CC.gold} />
          </button>
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
        <NextMatchCard match={next} player={p} collapsible />

        {/* encuesta de asistencia (vista admin) */}
        <PlayerMatchRsvp player={p} />

        {/* récord de partidos */}
        <MatchRecord player={p} matches={matchesQ.data ?? []} />

        {/* racha de asistencia */}
        <StreakCard history={history} />

        {/* asistencia — tocar para desplegar el resumen mensual */}
        <Card
          pad={14}
          onClick={() => setShowMonthly((v) => !v)}
          style={{ marginBottom: showMonthly ? 10 : 16, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
        >
          <Ring value={att.rate} size={64} stroke={8} color={rateColor(att.rate)} track="rgba(14,58,92,0.08)">
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink }}>{fmtPct(att.rate)}</div>
          </Ring>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>Asistencia</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted, marginTop: 2 }}>{att.present} presentes de {att.total} prácticas registradas</div>
          </div>
          <div style={{ transform: showMonthly ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex', flexShrink: 0 }}>
            <Icon name="chevDown" size={18} color={CC.muted} sw={2.4} />
          </div>
        </Card>

        {showMonthly && (
          <MonthlySummaryCard
            practices={practicesQ.data ?? []}
            attendance={attendanceQ.data ?? []}
            matches={matchesQ.data ?? []}
            rsvp={rsvpQ.data ?? []}
            gymChecks={gymChecksQ.data ?? []}
            routines={routinesQ.data ?? []}
            player={p}
            today={todayISO()}
          />
        )}

        {/* documentación administrativa */}
        <AdminDocsCard player={p} canEdit toast={showToast} />

        {/* contacto */}
        {(p.phone || p.emergency_contact || p.emergency_medical || p.ci) && (
          <Card pad={14} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Contacto y emergencia</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {p.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Celular</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, marginTop: 2 }}>{p.phone}</div>
                  </div>
                  <a href={waUrl(p.phone)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#25D366', border: 'none', color: '#fff', padding: '7px 13px', borderRadius: 10, textDecoration: 'none', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                </div>
              )}
              {p.emergency_contact && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Emergencia</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, marginTop: 2 }}>{p.emergency_contact}</div>
                  </div>
                  {waUrl(p.emergency_contact) && (
                    <a href={waUrl(p.emergency_contact)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#25D366', border: 'none', color: '#fff', padding: '7px 13px', borderRadius: 10, textDecoration: 'none', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WA
                    </a>
                  )}
                </div>
              )}
              {p.emergency_medical && (
                <div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Sociedad médica</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, marginTop: 2 }}>{p.emergency_medical}</div>
                </div>
              )}
              {p.ci && (
                <div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Cédula de identidad</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, marginTop: 2 }}>{p.ci}</div>
                </div>
              )}
            </div>
          </Card>
        )}

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

      {avatarOpen && p.photo_url && (
        <div onClick={() => setAvatarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <img src={p.photo_url} alt={p.name} style={{ maxWidth: '90vw', maxHeight: '82vh', borderRadius: 18, objectFit: 'contain', boxShadow: '0 12px 60px rgba(0,0,0,0.6)' }} onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setAvatarOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 42, height: 42, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <Icon name="x" size={20} color="#fff" sw={2.4} />
          </button>
          <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 }}>{p.name}</div>
        </div>
      )}
    </div>
  );
}
