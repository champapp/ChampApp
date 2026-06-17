import { useState } from 'react';
import { CC, Icon, Card, SectionTitle, Segmented, Chip, Toast, fmtPct, monthName } from '../../ui';
import {
  CATS, GYM_CATS, GYM_PRESETS, monthsList, todayISO,
  categoryAttendance, leastAttenders, playerAttendance, latestGymMarks, injuryStatus, protocolsForInjury,
} from '../../lib/domain';
import {
  usePlayers, usePractices, useAttendance, useMatches, useRsvp, useGymMarks, useAllInjuries, useInjuryProtocols, useFisioBookings,
} from '../../lib/queries';
import { useToast } from '../../lib/useToast';
import { downloadCSV } from '../../lib/csv';

function ExportLoading() {
  return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>
      Cargando…
    </div>
  );
}

// Exportes a CSV (Excel / Google Sheets) para el admin: asistencia,
// ranking, mediciones de gimnasio e historial de lesiones.
export function ExportScreen() {
  const [toast, showToast] = useToast();
  const [month, setMonth] = useState('all');
  const [catId, setCatId] = useState('all');

  const playersQ = usePlayers();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const gymMarksQ = useGymMarks();
  const injuriesQ = useAllInjuries();
  const protocolsQ = useInjuryProtocols();
  const fisioQ = useFisioBookings();

  const queries = [playersQ, practicesQ, attendanceQ, matchesQ, rsvpQ, gymMarksQ, injuriesQ, protocolsQ, fisioQ];
  if (queries.some((q) => q.isLoading)) return <ExportLoading />;

  const players = playersQ.data ?? [];
  const practices = practicesQ.data ?? [];
  const attendance = attendanceQ.data ?? [];
  const matches = matchesQ.data ?? [];
  const rsvp = rsvpQ.data ?? [];
  const gymMarks = gymMarksQ.data ?? [];
  const injuries = injuriesQ.data ?? [];
  const protocols = protocolsQ.data ?? [];
  const fisio = fisioQ.data ?? [];

  const mLabel = month === 'all' ? 'temporada' : monthName(month).toLowerCase();

  function expPlayers() {
    let ps = players;
    if (catId !== 'all') ps = ps.filter((p) => p.cat === catId);
    const rows = [['Jugador', 'Categoría', 'Subcategoría', 'Año', 'Presentes', 'Total prácticas', '% Asistencia']];
    ps.forEach((p) => {
      const a = playerAttendance({ practices, attendance, matches, rsvp, player: p, month });
      rows.push([p.name, p.cat, p.sub || '', p.birth_year || '', a.present, a.total, fmtPct(a.rate)]);
    });
    downloadCSV(`asistencia_jugadores_${mLabel}.csv`, rows);
    showToast('CSV de jugadores descargado');
  }

  function expCats() {
    const rows = [['Categoría', 'Descripción', 'Presencias', 'Registros totales', '% Asistencia', 'Prácticas']];
    categoryAttendance({ practices, attendance, month }).forEach((c) => {
      if (c.total) rows.push([c.id, c.full, c.present, c.total, fmtPct(c.rate), c.sessions]);
    });
    downloadCSV(`asistencia_categorias_${mLabel}.csv`, rows);
    showToast('CSV de categorías descargado');
  }

  function expRanking() {
    const rows = [['Posición', 'Jugador', 'Categoría', '% Asistencia', 'Presentes', 'Total']];
    CATS.forEach((cat) => {
      const list = leastAttenders({ practices, attendance, matches, rsvp, players, cat: cat.id, sub: null, month, limit: players.length });
      list.forEach((p, i) => rows.push([i + 1, p.name, cat.id + (p.sub ? ' ' + p.sub : ''), fmtPct(p.att.rate), p.att.present, p.att.total]));
    });
    downloadCSV(`ranking_asistencia_${mLabel}.csv`, rows);
    showToast('CSV de ranking descargado');
  }

  function expGym() {
    const rows = [['Jugador', 'Categoría', 'Peso (kg)', 'Talla (cm)', 'IMC', ...GYM_PRESETS.map((g) => `${g.name} (${g.unit})`), 'Objetivo']];
    players
      .filter((p) => GYM_CATS.includes(p.cat) && (catId === 'all' || p.cat === catId))
      .forEach((p) => {
        const latest = latestGymMarks(gymMarks, p.id);
        const marks = GYM_PRESETS.map((g) => latest[g.name] ? latest[g.name].value : '');
        rows.push([p.name, p.cat + (p.sub ? ' ' + p.sub : ''), p.peso ?? '', p.talla ?? '', p.imc ?? '', ...marks, p.objetivo || '']);
      });
    downloadCSV('mediciones_gimnasio.csv', rows);
    showToast('CSV de mediciones descargado');
  }

  function expAttendancePDF() {
    const today = todayISO();
    const catList = catId === 'all' ? CATS.map((c) => c.id) : [catId];

    const sections = catList.map((cat) => {
      const catPlayers = players.filter((p) => p.cat === cat).sort((a, b) => a.name.localeCompare(b.name));
      if (!catPlayers.length) return null;
      const catPractices = practices
        .filter((pr) => pr.cat === cat && pr.date <= today)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8)
        .reverse();
      const presenceMap = new Map();
      attendance.forEach((a) => presenceMap.set(`${a.player_id}_${a.practice_id}`, a.status));
      const rows = catPlayers.map((player) => {
        const att = playerAttendance({ practices, attendance, matches, rsvp, player });
        const checks = catPractices.map((pr) => presenceMap.get(`${player.id}_${pr.id}`) || '');
        return { name: player.name, rate: Math.round((att.rate || 0) * 100), checks };
      });
      return { cat, catPractices, rows };
    }).filter(Boolean);

    if (!sections.length) { showToast('Sin jugadores para exportar'); return; }

    const fmtD = (iso) => { const [y, m, d] = iso.split('-'); return `${d}/${m}`; };
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Planilla de Asistencia · Champagnat Rugby</title>
<style>
  @page { size: A4 landscape; margin: 12mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9px; color: #222; }
  .section { page-break-after: always; padding-bottom: 8px; }
  .section:last-child { page-break-after: avoid; }
  .header { background: #07243d; color: #fff; padding: 7px 10px; border-radius: 5px 5px 0 0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
  .header h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }
  .header span { font-size: 9px; opacity: 0.7; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0e3a5c; color: #fff; padding: 5px 5px; text-align: left; font-size: 8.5px; font-weight: 700; border: 1px solid #07243d; }
  th.center { text-align: center; }
  td { border: 1px solid #d0d8e0; padding: 4px 5px; font-size: 9px; }
  tr:nth-child(even) td { background: #f5f8fa; }
  .p { color: #1e9e6a; font-weight: 700; text-align: center; }
  .a { color: #e0524e; font-weight: 700; text-align: center; }
  .nd { color: #bbb; text-align: center; }
  .rate { font-weight: 700; text-align: right; }
  .rate-good { color: #1e9e6a; }
  .rate-med { color: #d97706; }
  .rate-bad { color: #e0524e; }
  footer { font-size: 7.5px; color: #999; margin-top: 5px; text-align: right; }
</style>
</head><body>
${sections.map(({ cat, catPractices, rows }) => `
<div class="section">
  <div class="header">
    <h2>Champagnat Rugby · ${cat} · Planilla de Asistencia</h2>
    <span>Exportado ${today}</span>
  </div>
  <table>
    <thead><tr>
      <th style="min-width:150px">Jugador</th>
      <th class="center" style="min-width:42px">%</th>
      ${catPractices.map((pr) => `<th class="center" style="min-width:30px">${fmtD(pr.date)}</th>`).join('')}
    </tr></thead>
    <tbody>
      ${rows.map(({ name, rate, checks }) => {
        const rc = rate >= 75 ? 'rate-good' : rate >= 50 ? 'rate-med' : 'rate-bad';
        return `<tr>
          <td>${name}</td>
          <td class="rate ${rc}">${rate}%</td>
          ${checks.map((c) => c === 'P' ? '<td class="p">✓</td>' : c === 'A' ? '<td class="a">✗</td>' : '<td class="nd">—</td>').join('')}
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  <footer>${rows.length} jugador${rows.length !== 1 ? 'es' : ''} · últimas ${catPractices.length} práctica${catPractices.length !== 1 ? 's' : ''}</footer>
</div>`).join('')}
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { showToast('Habilitá las ventanas emergentes para exportar'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
    showToast('Planilla generada — guardá como PDF desde el diálogo de impresión');
  }

  function expInjuries() {
    const rows = [['Jugador', 'Categoría', 'Estado', 'Fecha de consulta', 'Diagnóstico', 'Protocolos', 'Fecha de retorno', 'Días restantes', 'Consultas fisio']];
    const protoTxt = (injuryId) => protocolsForInjury(protocols, injuryId)
      .map((pr) => '[' + (pr.date || '') + (pr.by ? ' · ' + pr.by : '') + '] ' + pr.text).join('  |  ');
    const fisioTxt = (playerId) => fisio
      .filter((b) => b.player_id === playerId && !b.wait)
      .slice().sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
      .map((b) => b.date + (b.time ? ' ' + b.time : '') + (b.reason ? ' · ' + b.reason : '')).join('  |  ');

    let n = 0;
    const today = todayISO();
    players.filter((p) => catId === 'all' || p.cat === catId).forEach((p) => {
      const catLabel = p.cat + (p.sub ? ' ' + p.sub : '');
      injuries
        .filter((inj) => inj.player_id === p.id)
        .sort((a, b) => (a.since || '').localeCompare(b.since || ''))
        .forEach((inj) => {
          if (inj.closed_at) {
            rows.push([p.name, catLabel, 'Recuperado (alta ' + inj.closed_at.slice(0, 10) + ')', inj.since || '', inj.reason || '', protoTxt(inj.id), inj.return_date || '', '', fisioTxt(p.id)]);
          } else {
            const st = injuryStatus(inj, today);
            rows.push([p.name, catLabel, st ? 'En recuperación' : 'Retorno cumplido', inj.since || '', inj.reason || '', protoTxt(inj.id), inj.return_date || '', st ? st.days : 0, fisioTxt(p.id)]);
          }
          n++;
        });
    });
    if (n === 0) { showToast('No hay lesiones registradas para exportar'); return; }
    downloadCSV('historial_lesiones.csv', rows);
    showToast('CSV de lesiones descargado');
  }

  const cards = [
    { t: 'Planilla de asistencia PDF', d: 'Una página por categoría con las últimas 8 prácticas. Guardá como PDF desde el diálogo de impresión.', icon: 'download', fn: expAttendancePDF, highlight: true },
    { t: 'Asistencia por jugador', d: 'Una fila por jugador con su % de asistencia.', icon: 'players', fn: expPlayers },
    { t: 'Asistencia por categoría', d: 'Resumen agregado por categoría.', icon: 'whistle', fn: expCats },
    { t: 'Ranking de asistencia', d: 'Orden de menor a mayor, por categoría.', icon: 'trophy', fn: expRanking },
    { t: 'Mediciones de gimnasio', d: 'Datos físicos y últimos registros de fuerza.', icon: 'weight', fn: expGym },
    { t: 'Historial de lesiones', d: 'Consulta, diagnóstico, protocolos y fechas de retorno.', icon: 'medkit', fn: expInjuries },
  ];

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="download">Exportar datos</SectionTitle>

      <Card pad={14} style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(30,158,106,0.07)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(30,158,106,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="check" size={20} color={CC.good} sw={2.6} />
        </div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink }}>
          Archivos <b>.CSV</b> compatibles con <b>Excel</b> y <b>Google Sheets</b>. Importá directamente o abrí con doble clic.
        </div>
      </Card>

      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 7 }}>Filtros del export</div>
      <div style={{ marginBottom: 9 }}><Segmented small value={month} onChange={setMonth} options={monthsList()} /></div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 18 }}>
        <Chip active={catId === 'all'} onClick={() => setCatId('all')}>Todas</Chip>
        {CATS.map((c) => <Chip key={c.id} active={c.id === catId} onClick={() => setCatId(c.id)}>{c.id}</Chip>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cards.map((c) => (
          <Card key={c.t} pad={14} onClick={c.fn} style={{ display: 'flex', alignItems: 'center', gap: 13, border: c.highlight ? `1.5px solid ${CC.gold}` : undefined }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: c.highlight ? CC.gold : CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={c.icon} size={22} color={c.highlight ? CC.navy900 : CC.gold} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3 }}>{c.t}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 1 }}>{c.d}</div>
            </div>
            <div style={{ color: CC.gold }}><Icon name="download" size={22} sw={2.2} /></div>
          </Card>
        ))}
      </div>
      <Toast msg={toast} />
    </div>
  );
}
