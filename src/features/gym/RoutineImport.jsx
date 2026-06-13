import { useState } from 'react';
import { CC, Icon } from '../../ui';
import { useUpsertRoutine } from '../../lib/queries';

const ROUTINE_TEMPLATE = 'Rutina,Categoria,Bloque,Seccion,Ejercicio,Aproximaciones,SetRep,Descanso\n'
  + 'Semana 10 Apertura,PS,Día 1,CALENTAMIENTO,Programa regenerativo x 2,,,\n'
  + 'Semana 10 Apertura,PS,Día 1,POTENCIA,Bipodal al frente + lanzamientos MB frontales,-,3 x 5+5 + 20"+20",2 min\n'
  + 'Semana 10 Apertura,PS,Día 1,HIPERTROFIA,Pecho plano c/manc + sentadilla frontal + remo c/manc,1x10,3 x 8+8+8,2 min\n'
  + 'Semana 10 Apertura,PS,Día 1,FÍSICO,Bici 10" al palo + 20" suave x 6,,,\n'
  + 'Semana 10 Apertura,PS,Día 2,CALENTAMIENTO,Sesión D de levantamiento x 4 series,,,\n'
  + 'Semana 10 Apertura,PS,Día 2,POTENCIA,Salto largo + peso muerto a velocidad (30%),1x10-1x8-1x6,4 x 5+5,3 min\n';

function parseCSV(text) {
  const rows = [];
  text = text.replace(/\r/g, '');
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  for (const line of lines) {
    const cells = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if ((ch === ',' || ch === ';') && !inQ) { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells.map((c) => c.trim()));
  }
  return rows;
}

function csvToRoutines(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.toLowerCase());
  const idx = (names) => head.findIndex((h) => names.some((n) => h.includes(n)));
  const ci = { rutina: idx(['rutina', 'nombre']), cat: idx(['categor']), bloque: idx(['bloque', 'día', 'dia']), sec: idx(['seccion', 'sección']), ej: idx(['ejercicio']), aprox: idx(['aprox']), setrep: idx(['setrep', 'set/rep', 'set rep']), series: idx(['serie']), reps: idx(['rep']), pausa: idx(['pausa', 'descanso']) };
  if (ci.ej < 0) return [];
  const map = {};
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]; const get = (i) => (i >= 0 && i < row.length ? row[i] : '');
    const rut = get(ci.rutina) || 'Rutina importada';
    const cat = (get(ci.cat) || 'all').toUpperCase().replace('TODO', 'all').replace('TODOS', 'all') || 'all';
    const bloque = get(ci.bloque) || 'Bloque 1';
    const ej = get(ci.ej); if (!ej) continue;
    const section = get(ci.sec).toUpperCase();
    const aprox = get(ci.aprox);
    const setrep = get(ci.setrep); const series = get(ci.series); const reps = get(ci.reps); const pausa = get(ci.pausa);
    let detail = setrep;
    if (!detail) { if (series && reps) detail = series + '×' + reps; else if (reps) detail = reps; }
    const key = rut + '||' + cat;
    if (!map[key]) map[key] = { title: rut, cat: cat === 'ALL' ? 'all' : cat, blocks: {} };
    if (!map[key].blocks[bloque]) map[key].blocks[bloque] = [];
    map[key].blocks[bloque].push({ section, name: ej, aprox, detail, rest: pausa });
  }
  return Object.values(map).map((r) => ({ title: r.title, cat: r.cat, note: '', blocks: Object.keys(r.blocks).map((b) => ({ title: b, exercises: r.blocks[b] })) }));
}

// Modal de importación de rutinas desde una planilla CSV (Excel / Google Sheets).
export function RoutineImport({ onClose, toast }) {
  const upsert = useUpsertRoutine();
  const [text, setText] = useState('');

  function onFile(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setText(String(r.result));
    r.readAsText(f);
    e.target.value = '';
  }
  function downloadTemplate() {
    const blob = new Blob([ROUTINE_TEMPLATE], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'plantilla-rutinas-champapp.csv'; a.click();
  }

  const preview = text.trim() ? csvToRoutines(text) : [];

  async function doImport() {
    const routines = csvToRoutines(text);
    if (!routines.length) { toast('No pude leer la planilla. Revisá el formato.'); return; }
    try {
      for (const r of routines) {
        const cats = r.cat === 'all' ? ['all'] : [r.cat];
        await upsert.mutateAsync({ title: r.title, cats, note: r.note || '', blocks: r.blocks });
      }
      onClose();
      toast(routines.length + ' rutina' + (routines.length === 1 ? '' : 's') + ' importada' + (routines.length === 1 ? '' : 's') + ' ✓');
    } catch {
      toast('No se pudo importar. Probá de nuevo.');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 330, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="download" size={20} color="#fff" sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Importar rutinas</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Desde Excel o Google Sheets (CSV)</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: `1px solid ${CC.line}`, borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15.5, color: CC.ink, letterSpacing: 0.2, marginBottom: 6 }}>Cómo armar la planilla</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, lineHeight: 1.5 }}>Una fila por ejercicio, con estas columnas (igual que tu planilla de gimnasio):<br /><b style={{ color: CC.ink }}>Rutina · Categoria · Bloque (día) · Seccion · Ejercicio · Aproximaciones · SetRep · Descanso</b><br />Las filas con la misma <i>Rutina</i> y <i>Bloque</i> se agrupan solas. En Google Sheets: <b>Archivo → Descargar → CSV</b> y subí el archivo.</div>
            <button onClick={downloadTemplate} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, border: `1.5px solid ${CC.navy}`, background: '#fff', color: CC.navy, borderRadius: 10, padding: '8px 13px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}><Icon name="download" size={15} color={CC.navy} sw={2.3} />Descargar plantilla modelo</button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `1.5px dashed ${CC.navy}`, background: 'rgba(14,58,92,0.03)', borderRadius: 12, padding: '14px', cursor: 'pointer', color: CC.navy, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16 }}>
            <Icon name="download" size={17} color={CC.navy} sw={2.4} style={{ transform: 'rotate(180deg)' }} />Subir archivo CSV
            <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} style={{ display: 'none' }} />
          </label>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase' }}>…o pegá el contenido</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Rutina,Categoria,Bloque,Ejercicio,Series,Reps,Pausa…" style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '10px 12px', fontFamily: 'ui-monospace, monospace', fontSize: 12.5, color: CC.ink, background: '#fff', resize: 'vertical', lineHeight: 1.4 }} />
          {preview.length > 0 && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.good, fontWeight: 600 }}>✓ Detecté {preview.length} rutina{preview.length === 1 ? '' : 's'}: {preview.map((r) => r.title).join(', ')}</div>}
          {preview.length === 0 && text.trim() && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.bad, fontWeight: 600 }}>No reconocí el formato. Si es un archivo de Excel (.xlsx), abrilo y hacé <b>Archivo → Descargar → CSV</b>, y subí ese archivo.</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={doImport} disabled={!preview.length || upsert.isPending} style={{ flex: 1.6, border: 'none', background: preview.length ? CC.gold : CC.line, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: preview.length ? 'pointer' : 'default', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: upsert.isPending ? 0.7 : 1 }}><Icon name="check" size={18} color={CC.navy900} sw={2.6} />Importar</button>
        </div>
      </div>
    </div>
  );
}
