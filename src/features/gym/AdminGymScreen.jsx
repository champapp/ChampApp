import { CC, SectionTitle, Card, Toast } from '../../ui';
import { useToast } from '../../lib/useToast';
import { usePlayers, useGymMarks, usePractices, useAttendance } from '../../lib/queries';
import { GYM_CATS, categoryAverages } from '../../lib/domain';
import { AdminRoutines } from './AdminRoutines';

function GymAveragesSection() {
  const playersQ = usePlayers();
  const gymMarksQ = useGymMarks();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();

  if (playersQ.isLoading || gymMarksQ.isLoading) return null;

  const players = playersQ.data ?? [];
  const gymMarks = gymMarksQ.data ?? [];
  const practices = practicesQ.data ?? [];
  const attendance = attendanceQ.data ?? [];

  const catData = GYM_CATS.map((cat) => {
    const avgs = categoryAverages({ practices, attendance, players, gymMarks, cat, sub: null });
    return { cat, gym: avgs.gym, rosterSize: avgs.rosterSize };
  }).filter((c) => Object.keys(c.gym).length > 0);

  if (catData.length === 0) return null;

  return (
    <>
      <SectionTitle icon="weight">Promedios por categoría</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
        {catData.map(({ cat, gym, rosterSize }) => {
          const exercises = Object.keys(gym);
          return (
            <Card key={cat} pad={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ background: CC.navy, borderRadius: 8, padding: '3px 10px' }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: 0.5 }}>{cat}</span>
                </div>
                <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted }}>{rosterSize} jugadores</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {exercises.map((ex) => {
                  const val = gym[ex];
                  const mark = gymMarks.find((m) => m.exercise === ex);
                  const unit = mark ? mark.unit : '';
                  return (
                    <div key={ex} style={{ background: CC.paper, borderRadius: 10, padding: '9px 11px' }}>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: CC.navy, lineHeight: 0.9 }}>{val.toFixed(1)}</span>
                        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint, fontWeight: 600 }}>{unit}</span>
                      </div>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 9.5, color: CC.faint, marginTop: 2 }}>promedio</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function AdminGymScreen() {
  const [toast, showToast] = useToast();
  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="weight">Gimnasio</SectionTitle>
      <AdminRoutines toast={showToast} />
      <GymAveragesSection />
      <Toast msg={toast} />
    </div>
  );
}
