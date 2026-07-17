import { useState, useRef } from 'react';
import { CC, Icon } from '../../ui';
import { usePlayers } from '../../lib/queries';
import { supabase } from '../../lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

// Acepta DD/MM/YYYY, DD-MM-YYYY o YYYY-MM-DD
function parseDate(raw) {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0];
  const sep = header.includes(';') ? ';' : ',';
  return lines.slice(1).map((line) => {
    const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ''));
    return {
      username: (parts[0] || '').toLowerCase().trim(),
      fecha: parts[1] || '',
      ejercicio: (parts[2] || '').trim(),
      valor: parts[3] || '',
      unidad: (parts[4] || '').trim(),
    };
  }).filter((r) => r.username && r.fecha && r.ejercicio && r.valor);
}

export function BulkMarksUpload({ onClose }) {
  const [rows, setRows] = useState(null);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();
  const playersQ = usePlayers();
  const queryClient = useQueryClient();

  const players = playersQ.data ?? [];

  function handleFile(file) {
    if (!file) return;
    file.text().then((text) => {
      const parsed = parseCSV(text);
      setRows(parsed);
      setResults([]);
      setDone(false);
    });
  }

  async function runImport() {
    if (!rows || running) return;
    setRunning(true);
    const newResults = [];

    // Construir mapa username → player
    const byUsername = new Map(players.map((p) => [p.username, p]));

    const toInsert = [];
    const rowsMeta = [];
    for (const row of rows) {
      const player = byUsername.get(row.username);
      if (!player) {
        newResults.push({ row, status: 'error', msg: `Jugador no encontrado: "${row.username}"` });
        continue;
      }
      const date = parseDate(row.fecha);
      if (!date) {
        newResults.push({ row, status: 'error', msg: `Fecha inválida: "${row.fecha}"` });
        continue;
      }
      const value = parseFloat(row.valor.replace(',', '.'));
      if (isNaN(value)) {
        newResults.push({ row, status: 'error', msg: `Valor inválido: "${row.valor}"` });
        continue;
      }
      toInsert.push({ player_id: player.id, exercise: row.ejercicio, value, unit: row.unidad || '', date });
      rowsMeta.push(row);
    }

    // Insertar en bloque si no hay errores graves, o de a batch de 50
    const validRows = toInsert;

    if (validRows.length > 0) {
      try {
        const BATCH = 50;
        for (let i = 0; i < validRows.length; i += BATCH) {
          const { error } = await supabase.from('gym_marks').insert(validRows.slice(i, i + BATCH));
          if (error) throw error;
          rowsMeta.slice(i, i + BATCH).forEach((r) => newResults.push({ row: r, status: 'ok', msg: `${r.ejercicio} · ${r.valor}` }));
          setResults([...newResults]);
        }
        queryClient.invalidateQueries({ queryKey: ['gym_marks'] });
      } catch (err) {
        rowsMeta.forEach((r) => newResults.push({ row: r, status: 'error', msg: err.message || 'Error de base de datos' }));
        setResults([...newResults]);
      }
    } else {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="upload" size={20} color={CC.gold} sw={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Importar mediciones históricas</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Columnas: usuario · fecha · ejercicio · valor · unidad</div>
          </div>
          {!running && (
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={18} color={CC.navy} sw={2.4} />
            </button>
          )}
        </div>

        <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Instrucciones */}
          <div style={{ background: 'rgba(14,58,92,0.05)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, lineHeight: 1.7 }}>
              <strong>Formato de columnas (separador: coma o punto y coma):</strong><br />
              <code style={{ background: 'rgba(14,58,92,0.08)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>usuario,fecha,ejercicio,valor,unidad</code><br />
              <strong>Fecha:</strong> DD/MM/AAAA o AAAA-MM-DD · <strong>Unidad:</strong> kg, rep, seg, etc.
            </div>
          </div>

          {/* File picker */}
          {!rows && (
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${CC.line}`, borderRadius: 16, padding: '32px 16px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
            >
              <Icon name="upload" size={32} color={CC.navy} sw={1.8} />
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.navy }}>Seleccionar archivo CSV</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted }}>Exportá desde Excel como CSV</div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          )}

          {/* Preview */}
          {rows && !running && !done && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink }}>{rows.length} filas encontradas</div>
                <button onClick={() => { setRows(null); setResults([]); }} style={{ border: 'none', background: 'transparent', color: CC.muted, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Barlow, sans-serif' }}>cambiar archivo</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                {rows.slice(0, 30).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', borderRadius: 10, border: `1px solid ${CC.line}` }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: CC.muted, minWidth: 80 }}>@{r.username}</span>
                    <span style={{ flex: 1, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink }}>{r.ejercicio}</span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.navy }}>{r.valor} {r.unidad}</span>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint }}>{r.fecha}</span>
                  </div>
                ))}
                {rows.length > 30 && <div style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, padding: 8 }}>… y {rows.length - 30} filas más</div>}
              </div>
            </>
          )}

          {/* Progress */}
          {(running || done) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ flex: 1, height: 8, background: CC.line, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: CC.navy, borderRadius: 4, width: `${(results.length / rows.length) * 100}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.ink, flexShrink: 0 }}>{results.length}/{rows.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                {results.slice(-50).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: r.status === 'ok' ? 'rgba(30,158,106,0.07)' : 'rgba(224,82,78,0.07)', borderRadius: 10, border: `1px solid ${r.status === 'ok' ? 'rgba(30,158,106,0.2)' : 'rgba(224,82,78,0.2)'}` }}>
                    <Icon name={r.status === 'ok' ? 'check' : 'alert'} size={14} color={r.status === 'ok' ? CC.good : CC.bad} sw={2.4} />
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: CC.muted, flexShrink: 0 }}>@{r.row.username}</span>
                    <span style={{ flex: 1, fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.ink }}>{r.row.ejercicio}</span>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: r.status === 'ok' ? CC.good : CC.bad }}>{r.msg}</span>
                  </div>
                ))}
              </div>
              {done && (
                <div style={{ background: `linear-gradient(145deg, ${CC.navy}, ${CC.navy900})`, borderRadius: 14, padding: '14px 16px', color: '#fff', display: 'flex', gap: 20, justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 30, color: '#7DE8B8' }}>{okCount}</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>importadas</div>
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
                {running ? 'Importando…' : rows ? `Importar ${rows.length} filas` : 'Seleccioná un archivo'}
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
