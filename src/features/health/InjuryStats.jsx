import { CC, Icon, Card, SectionTitle } from '../../ui';
import { usePlayers, useAllInjuries } from '../../lib/queries';

function StatChip({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: `1px solid ${CC.line}`, padding: '10px 11px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: color || CC.navy, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.muted, fontWeight: 600, marginTop: 3, lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}

export function InjuryStats() {
  const playersQ = usePlayers();
  const injuriesQ = useAllInjuries();

  if (playersQ.isLoading || injuriesQ.isLoading) return null;

  const players = playersQ.data ?? [];
  const injuries = injuriesQ.data ?? [];

  if (injuries.length === 0) return null;

  // Promedio de días de recuperación (solo lesiones cerradas con start + return_date)
  const closed = injuries.filter((i) => i.closed_at && i.return_date && i.created_at);
  const avgDays = closed.length
    ? Math.round(closed.reduce((sum, i) => {
        const start = new Date(i.created_at);
        const end = new Date(i.return_date);
        const days = Math.max(0, Math.round((end - start) / 86400000));
        return sum + days;
      }, 0) / closed.length)
    : null;

  // Lesiones por categoría
  const catCounts = {};
  injuries.forEach((i) => {
    const p = players.find((pl) => pl.id === i.player_id);
    if (!p) return;
    catCounts[p.cat] = (catCounts[p.cat] || 0) + 1;
  });
  const catRanking = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

  // Jugadores con más lesiones
  const playerCounts = {};
  injuries.forEach((i) => {
    playerCounts[i.player_id] = (playerCounts[i.player_id] || 0) + 1;
  });
  const topPlayers = Object.entries(playerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const p = players.find((pl) => String(pl.id) === String(id));
      return { name: p?.name || 'Desconocido', cat: p?.cat || '?', count };
    });

  // Lesiones activas vs cerradas
  const active = injuries.filter((i) => !i.closed_at).length;
  const historical = injuries.length;

  return (
    <>
      <SectionTitle icon="chart">Análisis de lesiones</SectionTitle>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <StatChip label="Total historico" value={historical} />
        <StatChip label="Activas" value={active} color={active > 0 ? CC.bad : CC.good} />
        {avgDays != null && <StatChip label="Días prom. recuperación" value={avgDays} color={CC.goldDeep} />}
      </div>

      {/* Lesiones por categoría */}
      {catRanking.length > 0 && (
        <Card pad={14} style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 10 }}>Por categoría</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {catRanking.map(([cat, count]) => {
              const max = catRanking[0][1];
              const pct = count / max;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.navy900, background: CC.gold, padding: '2px 8px', borderRadius: 5, minWidth: 40, textAlign: 'center' }}>{cat}</span>
                  <div style={{ flex: 1, background: CC.paper, borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: pct === 1 ? CC.bad : CC.goldDeep, borderRadius: 999, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.ink, minWidth: 18, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Jugadores con más lesiones */}
      {topPlayers.length > 0 && (
        <Card pad={14} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 10 }}>Jugadores más lesionados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {topPlayers.map((p, i) => (
              <div key={p.name + i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.faint, minWidth: 18 }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.muted }}>{p.cat}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: p.count >= 3 ? 'rgba(224,82,78,0.1)' : CC.paper, borderRadius: 8, padding: '3px 9px' }}>
                  <Icon name="medkit" size={12} color={p.count >= 3 ? CC.bad : CC.muted} sw={2.3} />
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: p.count >= 3 ? CC.bad : CC.ink }}>{p.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
