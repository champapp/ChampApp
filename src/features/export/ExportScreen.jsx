import { useState } from 'react';
import { CC, Icon, Card, SectionTitle, Segmented, Chip, Toast, fmtPct, monthName } from '../../ui';
import {
  CATS, GYM_CATS, GYM_PRESETS, monthsList, todayISO,
  categoryAttendance, leastAttenders, playerAttendance, latestGymMarks, injuryStatus, protocolsForInjury,
} from '../../lib/domain';
import {
  usePlayers, usePractices, useAttendance, useMatches, useRsvp, useGymMarks, useAllInjuries, useInjuryProtocols, useFisioBookings, useShopItems,
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
function pdfMonthOptions() {
  const today = todayISO();
  const [y, m] = today.slice(0, 7).split('-').map(Number);
  const NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const opts = [];
  for (let i = 23; i >= 0; i--) {
    let mm = m - i; let yy = y;
    while (mm <= 0) { mm += 12; yy -= 1; }
    const val = `${yy}-${String(mm).padStart(2, '0')}`;
    opts.push({ value: val, label: `${NAMES[mm - 1]} ${yy}` });
  }
  return opts;
}

export function ExportScreen() {
  const [toast, showToast] = useToast();
  const today0 = todayISO().slice(0, 7);
  const [month, setMonth] = useState(today0);
  const [catId, setCatId] = useState('all');
  const [pdfFrom, setPdfFrom] = useState(today0);
  const [pdfTo, setPdfTo] = useState(today0);

  const playersQ = usePlayers();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const gymMarksQ = useGymMarks();
  const injuriesQ = useAllInjuries();
  const protocolsQ = useInjuryProtocols();
  const fisioQ = useFisioBookings();
  const shopItemsQ = useShopItems();

  const queries = [playersQ, practicesQ, attendanceQ, matchesQ, rsvpQ, gymMarksQ, injuriesQ, protocolsQ, fisioQ, shopItemsQ];
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
  const shopItems = shopItemsQ.data ?? [];

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
    const fromDate = pdfFrom + '-01';
    const toDate = pdfTo + '-31';

    const presenceMap = new Map();
    attendance.forEach((a) => presenceMap.set(`${a.player_id}_${a.practice_id}`, a.status));

    const sections = catList.map((cat) => {
      const catPlayers = players.filter((p) => p.cat === cat).sort((a, b) => a.name.localeCompare(b.name));
      if (!catPlayers.length) return null;
      const catPractices = practices
        .filter((pr) => pr.cat === cat && pr.date >= fromDate && pr.date <= toDate)
        .sort((a, b) => a.date.localeCompare(b.date));

      // Agrupar prácticas por fecha (puede haber varias por día si hay subcategorías)
      const dateMap = new Map();
      catPractices.forEach((pr) => {
        if (!dateMap.has(pr.date)) dateMap.set(pr.date, []);
        dateMap.get(pr.date).push(pr.id);
      });
      const uniqueDates = [...dateMap.keys()].sort();

      const rows = catPlayers.map((player) => {
        const att = playerAttendance({ practices, attendance, matches, rsvp, player });
        const checks = uniqueDates.map((date) => {
          const statuses = dateMap.get(date).map((pid) => presenceMap.get(`${player.id}_${pid}`) || '');
          if (statuses.includes('P')) return 'P';
          if (statuses.includes('A')) return 'A';
          return '';
        });
        return { name: player.name, rate: Math.round((att.rate || 0) * 100), checks };
      });
      return { cat, uniqueDates, rows };
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
${sections.map(({ cat, uniqueDates, rows }) => `
<div class="section">
  <div class="header">
    <h2>Champagnat Rugby · ${cat} · Planilla de Asistencia</h2>
    <span>Exportado ${today}</span>
  </div>
  <table>
    <thead><tr>
      <th style="min-width:150px">Jugador</th>
      <th class="center" style="min-width:42px">%</th>
      ${uniqueDates.map((d) => `<th class="center" style="min-width:30px">${fmtD(d)}</th>`).join('')}
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
  <footer>${rows.length} jugador${rows.length !== 1 ? 'es' : ''} · ${uniqueDates.length} día${uniqueDates.length !== 1 ? 's' : ''} · período ${pdfFrom} / ${pdfTo}</footer>
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

  function expShopPDF() {
    if (!shopItems.length) { showToast('No hay productos en el shop'); return; }
    const today = todayISO();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Stock del Shop · Champagnat Rugby</title>
<style>
  @page { size: A4 portrait; margin: 14mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #222; }
  .header { background: #07243d; color: #fff; padding: 8px 12px; border-radius: 5px 5px 0 0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
  .header h2 { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
  .header span { font-size: 9px; opacity: 0.7; }
  table { width: 100%; border-collapse: collapse; margin-top: 0; }
  th { background: #0e3a5c; color: #fff; padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 700; border: 1px solid #07243d; }
  td { border: 1px solid #d0d8e0; padding: 5px 8px; font-size: 10px; vertical-align: top; }
  tr:nth-child(even) td { background: #f5f8fa; }
  .good { color: #1e9e6a; font-weight: 700; }
  .bad { color: #e0524e; font-weight: 700; }
  .sizes { display: flex; flex-wrap: wrap; gap: 4px; }
  .size-chip { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 700; }
  .size-ok { background: #d1fae5; color: #065f46; }
  .size-out { background: #fee2e2; color: #991b1b; }
  footer { font-size: 8px; color: #999; margin-top: 6px; text-align: right; }
</style>
</head><body>
<div class="header">
  <h2>Champagnat Rugby · Champa Shop · Stock</h2>
  <span>Exportado ${today}</span>
</div>
<table>
  <thead><tr>
    <th style="width:30%">Producto</th>
    <th style="width:12%">Precio</th>
    <th style="width:12%">Vendidos</th>
    <th>Talles y stock</th>
  </tr></thead>
  <tbody>
    ${shopItems.map((item) => {
      const totalStock = (item.sizes || []).reduce((a, s) => a + (s.stock || 0), 0);
      const sizeCells = (item.sizes || []).map((s) =>
        `<span class="size-chip ${s.stock > 0 ? 'size-ok' : 'size-out'}">${s.size}: ${s.stock}</span>`
      ).join(' ');
      return `<tr>
        <td><b>${item.name}</b>${item.descr ? '<br><span style="color:#666;font-size:9px">' + item.descr + '</span>' : ''}</td>
        <td>$${item.price ?? '—'}</td>
        <td class="${(item.sold || 0) > 0 ? 'good' : ''}">${item.sold || 0}</td>
        <td><div class="sizes">${sizeCells || '<span style="color:#bbb">Sin talles</span>'}</div><div style="margin-top:3px;font-size:9px;color:#555">Total: <b class="${totalStock > 0 ? 'good' : 'bad'}">${totalStock}</b></div></td>
      </tr>`;
    }).join('')}
  </tbody>
</table>
<footer>${shopItems.length} producto${shopItems.length !== 1 ? 's' : ''} · ${shopItems.reduce((a, i) => a + (i.sizes || []).reduce((b, s) => b + (s.stock || 0), 0), 0)} unidades totales</footer>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { showToast('Habilitá las ventanas emergentes para exportar'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
    showToast('Stock del shop generado — guardá como PDF');
  }

  const pdfMonthOpts = pdfMonthOptions();
  const selStyle = { border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '8px 10px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.ink, background: '#fff', cursor: 'pointer', flex: 1 };

  const cards = [
    {
      t: 'Planilla de asistencia PDF',
      d: 'Una página por categoría. Elegí el período y guardá como PDF desde el diálogo de impresión.',
      icon: 'download', fn: expAttendancePDF, highlight: true,
      extra: (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Desde</div>
            <select value={pdfFrom} onChange={(e) => setPdfFrom(e.target.value)} style={selStyle}>
              {pdfMonthOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, color: CC.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Hasta</div>
            <select value={pdfTo} onChange={(e) => setPdfTo(e.target.value)} style={selStyle}>
              {pdfMonthOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      ),
    },
    { t: 'Asistencia por jugador', d: 'Una fila por jugador con su % de asistencia.', icon: 'players', fn: expPlayers },
    { t: 'Asistencia por categoría', d: 'Resumen agregado por categoría.', icon: 'whistle', fn: expCats },
    { t: 'Ranking de asistencia', d: 'Orden de menor a mayor, por categoría.', icon: 'trophy', fn: expRanking },
    { t: 'Mediciones de gimnasio', d: 'Datos físicos y últimos registros de fuerza.', icon: 'weight', fn: expGym },
    { t: 'Historial de lesiones', d: 'Consulta, diagnóstico, protocolos y fechas de retorno.', icon: 'medkit', fn: expInjuries },
    { t: 'Stock del Shop PDF', d: 'Tabla de productos con talles, stock disponible y vendidos.', icon: 'bag', fn: expShopPDF },
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
          <Card key={c.t} pad={14} onClick={c.extra ? undefined : c.fn} style={{ border: c.highlight ? `1.5px solid ${CC.gold}` : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, cursor: c.extra ? 'default' : 'pointer' }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: c.highlight ? CC.gold : CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={c.icon} size={22} color={c.highlight ? CC.navy900 : CC.gold} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3 }}>{c.t}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 1 }}>{c.d}</div>
              </div>
              <div style={{ color: CC.gold, cursor: 'pointer' }} onClick={c.extra ? c.fn : undefined}><Icon name="download" size={22} sw={2.2} /></div>
            </div>
            {c.extra}
          </Card>
        ))}
      </div>
      <Toast msg={toast} />
    </div>
  );
}
