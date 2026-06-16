import { useState } from 'react';
import { CC, Icon, Card, SectionTitle, fmtDate, MiniChart } from '../../ui';
import { gymMarksHistory } from '../../lib/domain';

// Historial de marcas por ejercicio: cada tarjeta se puede desplegar para
// ver todas las tomas, con la mejor marca destacada como RÉCORD.
export function GymMarksHistory({ gymMarks, player }) {
  const history = gymMarksHistory(gymMarks, player.id);
  const [open, setOpen] = useState(null);

  return (
    <>
      <SectionTitle icon="clock">Historial de mis marcas</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {history.map(({ exercise, unit, marks, best }) => {
          const isOpen = open === exercise;
          return (
            <Card key={exercise} pad={14}>
              <button
                onClick={() => setOpen(isOpen ? null : exercise)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exercise}</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 1 }}>{marks.length} {marks.length === 1 ? 'marca' : 'marcas'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(249,178,51,0.14)', borderRadius: 999, padding: '4px 10px', flexShrink: 0 }}>
                  <Icon name="medal" size={13} color={CC.goldDeep} sw={2.4} />
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.navy }}>{best.value}</span>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted, fontWeight: 600 }}>{unit}</span>
                </div>
                <Icon name={isOpen ? 'chevUp' : 'chevDown'} size={18} color={CC.faint} />
              </button>
              {isOpen && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${CC.line}` }}>
                  {marks.length >= 2 && (
                    <div style={{ marginBottom: 12 }}>
                      <MiniChart
                        data={marks.map((m) => ({ date: m.date, value: Number(m.value) }))}
                        unit={unit}
                        color={CC.navy}
                        height={64}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {marks.map((m) => {
                    const isBest = m === best;
                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isBest ? 'rgba(249,178,51,0.10)' : CC.paper, borderRadius: 10, padding: '7px 11px' }}>
                        <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted }}>{fmtDate(m.date)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink }}>
                            {m.value} <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted, fontWeight: 600 }}>{m.unit}</span>
                          </span>
                          {isBest && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: CC.gold, color: CC.navy900, borderRadius: 999, padding: '2px 8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 10.5, letterSpacing: 0.4 }}>
                              <Icon name="medal" size={10} color={CC.navy900} sw={3} />RÉCORD
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
