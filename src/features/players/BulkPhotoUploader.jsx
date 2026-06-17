import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CC, Icon } from '../../ui';
import { supabase } from '../../lib/supabaseClient';

const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

function normStr(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizePhotos(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => (typeof p === 'string' ? { url: p, title: '' } : p));
}

function parseFolderDate(folderName) {
  const n = folderName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [month, num] of Object.entries(MONTHS)) {
    if (n.includes(month)) {
      const y = n.match(/\d{4}/);
      const year = y ? parseInt(y[0]) : new Date().getFullYear();
      return `${year}-${String(num).padStart(2, '0')}-01`;
    }
  }
  const iso = folderName.match(/(\d{4})[^0-9](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-01`;
  return null;
}

function getLastName(player) {
  // username format "b.apellido" → apellido es la parte después del punto
  const parts = (player.username || '').split('.');
  if (parts.length === 2 && parts[1].length > 2) return parts[1];
  const words = (player.name || '').trim().split(/\s+/);
  return words.length > 1 ? words.slice(1).join(' ') : player.name || '';
}

function detectPlayer(fileName, players) {
  const base = normStr(fileName.replace(/\.[^.]+$/, ''));
  let bestId = null, bestLen = 0;
  for (const p of players) {
    const ln = normStr(getLastName(p));
    if (ln.length < 3) continue;
    if (base.includes(ln) && ln.length > bestLen) {
      bestId = p.id;
      bestLen = ln.length;
    }
  }
  return bestId;
}

function fmtMonthYear(iso) {
  if (!iso) return '';
  const [y, m] = iso.split('-');
  const MONTH_LABELS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${MONTH_LABELS[parseInt(m, 10) - 1]} ${y}`;
}

export function BulkPhotoUploader({ players, onClose }) {
  const qc = useQueryClient();
  const folderRef = useRef();
  const [step, setStep] = useState('idle');
  const [folderLabel, setFolderLabel] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState(null);

  function handleFolder(e) {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    const firstPath = files[0].webkitRelativePath || '';
    const folder = firstPath.split('/')[0] || '';
    const parsed = parseFolderDate(folder);
    setFolderLabel(folder || 'Sesión');
    setSessionDate(parsed || new Date().toISOString().slice(0, 8) + '01');

    setItems(files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      playerId: detectPlayer(file.name, players),
    })));
    setStep('review');
    e.target.value = '';
  }

  async function doUpload() {
    setStep('uploading');

    const grouped = {};
    for (const item of items) {
      if (!item.playerId) continue;
      if (!grouped[item.playerId]) grouped[item.playerId] = [];
      grouped[item.playerId].push(item.file);
    }

    const total = Object.values(grouped).reduce((s, a) => s + a.length, 0);
    let done = 0;
    setProgress({ done, total });

    let photoCount = 0;
    const affectedIds = Object.keys(grouped);

    for (const pid of affectedIds) {
      const files = grouped[pid];
      const player = players.find((p) => p.id === Number(pid));
      const existing = normalizePhotos(player?.gallery_photos);
      const added = [];

      for (const file of files) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `gallery/${pid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('player-photos').upload(path, file, {
          cacheControl: '3600', contentType: file.type || 'image/jpeg', upsert: false,
        });
        if (!error) {
          const { data } = supabase.storage.from('player-photos').getPublicUrl(path);
          added.push({ url: data.publicUrl, title: fmtMonthYear(sessionDate), date: sessionDate });
          photoCount++;
        }
        done++;
        setProgress({ done, total });
      }

      if (added.length) {
        await supabase.from('players').update({
          gallery_photos: [...existing, ...added],
        }).eq('id', Number(pid));
      }
    }

    qc.invalidateQueries({ queryKey: ['players'] });
    setSummary({ photos: photoCount, players: affectedIds.length });
    setStep('done');
  }

  const assignedCount = items.filter((i) => i.playerId).length;
  const sortedPlayers = players.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div
        onClick={step === 'review' ? onClose : undefined}
        style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.6)', backdropFilter: 'blur(3px)' }}
      />
      <div style={{
        position: 'relative', marginTop: 'auto', background: '#fff',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.25)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}`, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="camera" size={18} color={CC.navy} sw={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: CC.ink, letterSpacing: 0.3, lineHeight: 1 }}>
              Carga masiva de fotos
            </div>
            {folderLabel && step !== 'idle' && (
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {folderLabel} · {items.length} imagen{items.length !== 1 ? 'es' : ''}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: CC.muted, padding: 4, flexShrink: 0 }}>
            <Icon name="x" size={20} sw={2.5} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {step === 'idle' && (
            <div style={{ textAlign: 'center', padding: '24px 12px 12px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(14,58,92,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="camera" size={30} color={CC.navy} sw={2} />
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, marginBottom: 10 }}>
                Seleccioná la carpeta de fotos
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.muted, marginBottom: 28, lineHeight: 1.55, maxWidth: 320, margin: '0 auto 28px' }}>
                El nombre de la carpeta indica el mes de la sesión, por ejemplo <strong>Junio 2026</strong>. Los archivos se asignan automáticamente al jugador detectado en el nombre del archivo.
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: CC.navy, color: '#fff', padding: '13px 26px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>
                <Icon name="camera" size={18} color="#fff" sw={2.2} />
                Elegir carpeta
                <input
                  ref={folderRef}
                  type="file"
                  accept="image/*"
                  webkitdirectory=""
                  multiple
                  onChange={handleFolder}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {step === 'review' && (
            <>
              {/* Date */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 5 }}>Fecha de la sesión</div>
                <input
                  type="month"
                  value={sessionDate.slice(0, 7)}
                  onChange={(e) => setSessionDate(e.target.value + '-01')}
                  style={{ border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '9px 12px', fontFamily: 'Barlow, sans-serif', fontSize: 15, color: CC.ink, background: '#fff', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 8 }}>
                Asignación ({assignedCount}/{items.length} asignadas)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: item.playerId ? 'rgba(14,58,92,0.03)' : CC.paper,
                    borderRadius: 12, padding: '9px 11px',
                    border: `1.5px solid ${item.playerId ? 'rgba(14,58,92,0.12)' : CC.line}`,
                  }}>
                    <img src={item.previewUrl} alt="" style={{ width: 38, height: 48, objectFit: 'cover', borderRadius: 7, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>
                        {item.file.name}
                      </div>
                      <select
                        value={item.playerId ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems((prev) => prev.map((it, j) => j === i ? { ...it, playerId: val ? Number(val) : null } : it));
                        }}
                        style={{
                          width: '100%', border: `1.5px solid ${item.playerId ? CC.navy + '55' : CC.line}`,
                          borderRadius: 8, padding: '6px 8px',
                          fontFamily: 'Barlow, sans-serif', fontSize: 13,
                          color: item.playerId ? CC.ink : CC.muted, background: '#fff', cursor: 'pointer',
                        }}
                      >
                        <option value="">— No asignar —</option>
                        {sortedPlayers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} · {p.cat}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: item.playerId ? CC.good : CC.line, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                      <Icon name="check" size={11} color="#fff" sw={3} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 22, color: CC.ink, marginBottom: 20 }}>
                Subiendo fotos…
              </div>
              <div style={{ background: CC.paper, borderRadius: 10, height: 10, overflow: 'hidden', marginBottom: 10, maxWidth: 280, margin: '0 auto 10px' }}>
                <div style={{
                  height: '100%', borderRadius: 10, background: CC.navy,
                  width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted }}>
                {progress.done} de {progress.total}
              </div>
            </div>
          )}

          {step === 'done' && summary && (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Icon name="check" size={28} color={CC.good} sw={2.5} />
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, color: CC.ink, marginBottom: 10 }}>
                ¡Listo!
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 15, color: CC.muted, lineHeight: 1.5 }}>
                Se subieron <strong>{summary.photos}</strong> foto{summary.photos !== 1 ? 's' : ''} a <strong>{summary.players}</strong> jugador{summary.players !== 1 ? 'es' : ''}.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div style={{ padding: '12px 16px 20px', borderTop: `1px solid ${CC.line}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16 }}
              >Cancelar</button>
              <button
                onClick={doUpload}
                disabled={assignedCount === 0}
                style={{ flex: 2, border: 'none', background: assignedCount > 0 ? CC.navy : '#b0bec5', color: '#fff', padding: '12px', borderRadius: 12, cursor: assignedCount > 0 ? 'pointer' : 'default', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icon name="camera" size={17} color="#fff" sw={2.2} />
                Subir {assignedCount} foto{assignedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ padding: '12px 16px 20px', borderTop: `1px solid ${CC.line}`, flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ width: '100%', border: 'none', background: CC.navy, color: '#fff', padding: '13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}
            >Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}
