import { CC, Icon, Card, SectionTitle, Empty, Toast, fmtDate } from '../../ui';
import { useAuth } from '../auth/useAuth';
import { latestGymMarks, routinesForPlayer } from '../../lib/domain';
import { useRoutines, useGymChecks, useGymMarks, useMatches } from '../../lib/queries';
import { useToast } from '../../lib/useToast';
import { PlayerRoutines } from './PlayerRoutines';
import { GymMarksHistory } from './GymMarksHistory';
import { PlayerGallery } from '../players/PlayerGallery';
import { MatchRecord } from '../players/MatchRecord';

export function GymScreen() {
  const { player } = useAuth();
  const [toast, showToast] = useToast();
  const routinesQ = useRoutines();
  const gymChecksQ = useGymChecks();
  const gymMarksQ = useGymMarks();
  const matchesQ = useMatches();

  if (routinesQ.isLoading || gymChecksQ.isLoading || gymMarksQ.isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>;
  }

  const routines = routinesQ.data ?? [];
  const gymChecks = gymChecksQ.data ?? [];
  const gymMarks = gymMarksQ.data ?? [];
  const myRoutines = routinesForPlayer({ routines, gymChecks, player });
  const latest = latestGymMarks(gymMarks, player.id);
  const exercises = Object.keys(latest);

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="weight">Mi gimnasio</SectionTitle>

      {myRoutines.length ? (
        <PlayerRoutines player={player} routines={routines} gymChecks={gymChecks} toast={showToast} />
      ) : (
        <Card pad={20} style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ color: CC.faint, marginBottom: 8, display: 'flex', justifyContent: 'center' }}><Icon name="weight" size={30} /></div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.muted }}>Todavía no tenés rutinas asignadas.</div>
        </Card>
      )}

      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: CC.muted, textTransform: 'uppercase', margin: '4px 0 9px' }}>Mis marcas</div>
      {exercises.length ? (
        <Card pad={16}>
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
      ) : (
        <Card pad={14}><Empty t="Todavía no tenés mediciones cargadas" /></Card>
      )}

      {exercises.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <GymMarksHistory gymMarks={gymMarks} player={player} />
        </div>
      )}

      <MatchRecord player={player} matches={matchesQ.data ?? []} />

      <PlayerGallery player={player} isAdmin={false} />

      <Toast msg={toast} />
    </div>
  );
}
