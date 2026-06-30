import { useState, useRef } from 'react';
import { CC, Icon, Card } from '../../ui';
import { CATS, catById } from '../../lib/domain';
import { useCreatePlayer } from '../../lib/queries';

const PIN = '2026';

function removeAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function makeUsername(nombre, apellido) {
  const prefix = removeAccents(nombre.trim()).toLowerCase().replace(/[^a-z0-9]/g, '')[0] || 'x';
  const slug = removeAccents(apellido.trim()).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${prefix}.${slug}`;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0];
  const sep = header.includes(';') ? ';' : ',';
  return lines.slice(1)
    .map((line) => {
      const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      return {
        nombre: parts[0] || '',
        apellido: parts[1] || '',
        cat: (parts[2] || '').trim().toUpperCase(),
        sub: (parts[3] || '').trim(),
      };
    })
    .filter((r) => r.nombre && r.apellido && r.cat);
}

export function BulkPlayerUpload({ onClose, toast }) {
  const [rows, setRows] = useState(null);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();
  const createMutation = useCreatePlayer();

  function handleFile(file) {
    if (!file) return;
    file.text().then((text) => {
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast('No se encontraron filas válidas. Verificá el formato.');
        return;
      }
      setRows(parsed);
      setResults([]);
      setDone(false);
    });
  }

  async function runImport() {
    if (!rows || running) return;
    setRunning(true);
    const newResults = [];
    for (const row of rows) {
      const catDef = catById(row.cat);
      if (!catDef) {
        newResults.push({ row, status: 'error', msg: `Categoría inválida: "${row.cat}"` });
        setResults([...newResults]);
        continue;
      }
      const sub = catDef.subs?.includes(row.sub) ? row.sub : (catDef.subs?.[0] || null);
      const username = makeUsername(row.nombre, row.apellido);
      try {
        await createMutation.mutateAsync({
          nombre: row.nombre,
          apellido: row.apellido,
          cat: catDef.id,
          sub: sub || null,
          division: null,
          username,
          pin: PIN,
        });
        newResults.push({ row, status: 'ok', msg: `@${username}` });
      } catch (err) {
        const isDupe = err?.message?.includes('already') || err?.code === '23505';
        newResults.push({ row, status: 'error', msg: isDupe ? 'Usuario ya existe' : (err?.message || 'Error') });
      }
      setResults([...newResults]);
    }
    setRunning(false);
    setDone(true);
  }

  const okCount = results.filter((r) => r.status === 'ok').length;
  const errCount = results.filter((r) => r.status === 'error').length;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={!running ? onClose : undefined} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="upload" size={20} color={CC.gold} sw={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Importar jugadores (CSV)</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Columnas: nombre · apellido · categoria · subcategoria</div>
          </div>
          {!running && (
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={18} color={CC.navy} sw={2.4} />
            </button>
          )}
        </div>

        <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Categorías válidas */}
          <div style={{ background: 'rgba(14,58,92,0.05)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, lineHeight: 1.6 }}>
              <strong>Categorías válidas:</strong> {CATS.map((c) => c.id).join(', ')}<br />
              <strong>PIN asignado:</strong> {PIN} · <strong>Separador:</strong> coma (,) o punto y coma (;)
            </div>
          </div>

          {/* file picker */}
          {!rows && (
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${CC.line}`, borderRadius: 16, padding: '32px 16px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
            >
              <Icon name="upload" size={32} color={CC.navy} sw={1.8} />
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.navy }}>Seleccionar archivo CSV</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted }}>Exportá tu planilla de Excel como CSV y subila acá</div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          )}

          {/* preview */}
          {rows && !running && !done && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink }}>{rows.length} jugadores encontrados</div>
                <button onClick={() => { setRows(null); setResults([]); }} style={{ border: 'none', background: 'transparent', color: CC.muted, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Barlow, sans-serif' }}>cambiar archivo</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                {rows.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: '#fff', borderRadius: 10, border: `1px solid ${CC.line}` }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14, color: CC.ink }}>{r.nombre} {r.apellido}</span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: CC.faint, marginLeft: 8 }}>@{makeUsername(r.nombre, r.apellido)}</span>
                    </div>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.navy, background: 'rgba(14,58,92,0.08)', padding: '2px 8px', borderRadius: 6 }}>{r.cat}{r.sub ? ' · ' + r.sub : ''}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* progress */}
          {(running || done) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ flex: 1, height: 8, background: CC.line, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: CC.navy, borderRadius: 4, width: `${((results.length) / rows.length) * 100}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.ink, flexShrink: 0 }}>{results.length}/{rows.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: r.status === 'ok' ? 'rgba(30,158,106,0.07)' : 'rgba(224,82,78,0.07)', borderRadius: 10, border: `1px solid ${r.status === 'ok' ? 'rgba(30,158,106,0.2)' : 'rgba(224,82,78,0.2)'}` }}>
                    <Icon name={r.status === 'ok' ? 'check' : 'alert'} size={15} color={r.status === 'ok' ? CC.good : CC.bad} sw={2.4} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13.5, color: CC.ink }}>{r.row.nombre} {r.row.apellido}</span>
                    </div>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: r.status === 'ok' ? CC.good : CC.bad }}>{r.msg}</span>
                  </div>
                ))}
                {running && results.length < rows.length && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', color: CC.muted }}>
                    <Icon name="clock" size={15} color={CC.muted} sw={2} />
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13 }}>Procesando {rows[results.length]?.nombre} {rows[results.length]?.apellido}…</span>
                  </div>
                )}
              </div>
              {done && (
                <div style={{ background: `linear-gradient(145deg, ${CC.navy}, ${CC.navy900})`, borderRadius: 14, padding: '14px 16px', color: '#fff', display: 'flex', gap: 20, justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30, color: '#7DE8B8' }}>{okCount}</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>creados</div>
                  </div>
                  {errCount > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30, color: '#FF9D9A' }}>{errCount}</div>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>errores</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* footer */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          {!done ? (
            <>
              <button onClick={onClose} disabled={running} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: running ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, opacity: running ? 0.4 : 1 }}>Cancelar</button>
              <button
                onClick={rows && !running ? runImport : undefined}
                disabled={!rows || running}
                style={{ flex: 1.6, border: 'none', background: rows && !running ? CC.gold : 'rgba(14,58,92,0.15)', color: CC.navy900, padding: '13px', borderRadius: 13, cursor: rows && !running ? 'pointer' : 'default', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Icon name={running ? 'clock' : 'upload'} size={18} color={CC.navy900} sw={2.5} />
                {running ? `Importando ${results.length}/${rows?.length}…` : rows ? `Importar ${rows.length} jugadores` : 'Seleccioná un archivo'}
              </button>
            </>
          ) : (
            <button onClick={onClose} style={{ flex: 1, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>Listo</button>
          )}
        </div>
      </div>
    </div>
  );
}
