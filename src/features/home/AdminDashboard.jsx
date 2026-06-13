import { useState } from 'react';
import {
  CC, Icon, Card, SectionTitle, Segmented, Empty, Ring, Avatar, BarRow, LineChart, fmtPct, monthName, rateColor,
} from '../../ui';
import { CATS, monthsList, overall, categoryAttendance, monthlyTrend, leastAttenders } from '../../lib/domain';
import { InjuryDot } from '../../components/player/InjuryDot';
import { FeedBoard } from '../../components/feed/FeedBoard';

function StatPill({ label, value, accent }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30, lineHeight: 1, color: accent || '#fff' }}>{value}</div>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>{label}</div>
    </div>
  );
}

function Legend({ color, t }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />{t}
    </span>
  );
}

// Tarjeta colapsable con el resumen general de asistencia del club.
function ResumenCard({ ov, month, byCatCount }) {
  const [open, setOpen] = useState(false);
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="stats" size={20} color={CC.navy} sw={2.1} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Asistencia general</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 3 }}>{month === 'all' ? 'Temporada' : monthName(month)} · {ov.present} presentes · {ov.absent} ausentes</div>
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 24, color: rateColor(ov.rate), lineHeight: 1, marginRight: 4 }}>{fmtPct(ov.rate)}</div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{ background: `linear-gradient(155deg, ${CC.navy} 0%, ${CC.navy900} 100%)`, borderRadius: 18, padding: 18, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(249,178,51,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
              <Ring value={ov.rate} size={100} stroke={11} color={CC.gold}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 28, lineHeight: 1 }}>{fmtPct(ov.rate)}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, letterSpacing: 0.5, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>asistencia</div>
              </Ring>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1, background: 'rgba(30,158,106,0.22)', borderRadius: 10, padding: '7px 0', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: '#7DE8B8' }}>{ov.present}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>PRESENTES</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(224,82,78,0.2)', borderRadius: 10, padding: '7px 0', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: '#FF9D9A' }}>{ov.absent}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>AUSENTES</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <StatPill label="Jugadores" value={ov.players} />
              <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
              <StatPill label="Prácticas" value={ov.sessions} accent={CC.gold} />
              <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
              <StatPill label="Categorías" value={byCatCount} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Panel de estadísticas del admin: resumen general, asistencia por categoría,
// tendencia mensual y ranking de menor asistencia. Las tarjetas son
// reordenables/ocultables vía FeedBoard, igual que el feed del jugador.
export function AdminDashboard({ players, practices, attendance, matches, rsvp, month, setMonth, onOpenPlayer }) {
  const [trendCat, setTrendCat] = useState('all');
  const [rankCat, setRankCat] = useState('M15');

  const ov = overall({ practices, attendance, players, month });
  const byCat = categoryAttendance({ practices, attendance, month }).filter((c) => c.total > 0).sort((a, b) => b.rate - a.rate);
  const trend = monthlyTrend({ practices, attendance, cat: trendCat });
  const ranking = leastAttenders({ practices, attendance, matches, rsvp, players, cat: rankCat, sub: null, month, limit: 6 });

  const widgets = [
    { id: 'resumen', label: 'Resumen del club', icon: 'stats', node: <ResumenCard ov={ov} month={month} byCatCount={byCat.length} /> },
    {
      id: 'categorias', label: 'Asistencia por categoría', icon: 'stats',
      node: (
        <div>
          <SectionTitle icon="stats">Asistencia por categoría</SectionTitle>
          <Card pad={16}>
            {byCat.length === 0 ? <Empty t="Sin datos para este filtro" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {byCat.map((c) => <BarRow key={c.id} label={c.id} value={c.rate} color={`linear-gradient(90deg, ${CC.navy700}, ${CC.navy})`} />)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${CC.line}`, fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted }}>
              <Legend color={CC.good} t="≥85% óptimo" />
              <Legend color={CC.gold} t="70–84%" />
              <Legend color={CC.bad} t="<70% atención" />
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'tendencia', label: 'Tendencia mensual', icon: 'flame',
      node: (
        <div>
          <SectionTitle icon="flame">Tendencia mensual</SectionTitle>
          <Card pad={16}>
            <div style={{ marginBottom: 6 }}>
              <Segmented small value={trendCat} onChange={setTrendCat} options={[{ id: 'all', label: 'Todas' }, ...CATS.map((c) => ({ id: c.id, label: c.id }))]} />
            </div>
            <LineChart data={trend} />
          </Card>
        </div>
      ),
    },
    {
      id: 'ranking', label: 'Menor asistencia', icon: 'trophy',
      node: (
        <div>
          <SectionTitle icon="trophy">Menor asistencia · por categoría</SectionTitle>
          <Card pad={16}>
            <div style={{ marginBottom: 12 }}>
              <Segmented small value={rankCat} onChange={setRankCat} options={CATS.map((c) => ({ id: c.id, label: c.id }))} />
            </div>
            {ranking.length === 0 && <Empty t="Sin datos para este filtro" />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ranking.map((p, i) => (
                <div key={p.id} onClick={() => onOpenPlayer(p.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '9px 4px', cursor: 'pointer',
                  borderBottom: i < ranking.length - 1 ? `1px solid ${CC.line}` : 'none',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === 0 ? 'rgba(224,82,78,0.14)' : 'rgba(14,58,92,0.06)',
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15,
                    color: i === 0 ? CC.bad : CC.muted,
                  }}>{i + 1}</div>
                  <Avatar name={p.name} photo={p.photo_url} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 15, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      <InjuryDot injury={p.injury} />
                    </div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted }}>{p.att.present}/{p.att.total} prácticas {p.sub ? '· ' + p.sub : ''}</div>
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: rateColor(p.att.rate) }}>{fmtPct(p.att.rate)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Segmented options={monthsList()} value={month} onChange={setMonth} center />
      </div>
      <FeedBoard storageKey="champ_feed_admin" widgets={widgets} title="Personalizar mi panel" />
    </div>
  );
}
