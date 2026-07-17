import { useRef, useState } from 'react';
import { CC, Icon, SectionTitle } from '../../ui';
import { useUploadGalleryPhoto, useSavePlayerGallery } from '../../lib/queries';

// Normaliza la columna gallery_photos: acepta tanto string[] (URLs) como {url,title}[]
function normalizePhotos(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => (typeof p === 'string' ? { url: p, title: '' } : p));
}

function Lightbox({ photos, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const p = photos[idx];
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.93)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
        <Icon name="x" size={20} color="#fff" sw={2.5} />
      </button>

      <img
        src={p.url}
        alt={p.title || ''}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: 8 }}
      />

      {p.title && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 12, fontFamily: 'Barlow, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', padding: '0 24px', maxWidth: 400 }}>
          {p.title}
        </div>
      )}

      {photos.length > 1 && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + photos.length) % photos.length); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          ><Icon name="back" size={20} color="#fff" sw={2.5} /></button>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.6)', minWidth: 48, textAlign: 'center' }}>{idx + 1} / {photos.length}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % photos.length); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transform: 'rotate(180deg)' }}
          ><Icon name="back" size={20} color="#fff" sw={2.5} /></button>
        </div>
      )}
    </div>
  );
}

export function PlayerGallery({ player, isAdmin, toast }) {
  const [photos, setPhotos] = useState(() => normalizePhotos(player.gallery_photos));
  const [lightbox, setLightbox] = useState(null);
  const [delMode, setDelMode] = useState(false);
  const fileRef = useRef();

  const upload = useUploadGalleryPhoto();
  const save = useSavePlayerGallery();

  // Sincroniza si el servidor refresca los datos del jugador (ajuste en render, no en efecto)
  const [syncedGallery, setSyncedGallery] = useState(player.gallery_photos);
  if (syncedGallery !== player.gallery_photos) {
    setSyncedGallery(player.gallery_photos);
    setPhotos(normalizePhotos(player.gallery_photos));
  }

  function persist(next, successMsg) {
    setPhotos(next);
    save.mutate({ playerId: player.id, photos: next }, {
      onError: () => { toast?.('No se pudo guardar'); setPhotos(photos); },
      onSuccess: () => successMsg && toast?.(successMsg),
    });
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const added = [];
    for (const file of files) {
      try {
        const url = await upload.mutateAsync({ playerId: player.id, file });
        added.push({ url, title: '' });
      } catch {
        toast?.('Error al subir una foto');
      }
    }
    if (added.length) persist([...photos, ...added], 'Fotos guardadas');
    e.target.value = '';
  }

  function deletePhoto(idx) {
    const next = photos.filter((_, i) => i !== idx);
    if (!next.length) setDelMode(false);
    persist(next, 'Foto eliminada');
  }

  function updateTitle(idx, title) {
    const next = photos.map((p, i) => (i === idx ? { ...p, title } : p));
    persist(next);
  }

  const busy = upload.isPending || save.isPending;

  return (
    <>
      <SectionTitle
        icon="camera"
        action={isAdmin && photos.length > 0 ? (
          <button
            onClick={() => setDelMode((v) => !v)}
            style={{ background: delMode ? CC.bad : 'rgba(14,58,92,0.07)', border: 'none', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: delMode ? '#fff' : CC.muted, letterSpacing: 0.3 }}
          >{delMode ? 'Listo' : 'Eliminar'}</button>
        ) : null}
      >
        Fotos
      </SectionTitle>

      {photos.length === 0 && !isAdmin && (
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.faint, marginBottom: 16 }}>Sin fotos aún.</div>
      )}

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
          {photos.map((p, i) => (
            <div key={p.url + i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', background: 'rgba(14,58,92,0.06)' }}>
                <img
                  src={p.url}
                  alt={p.title || ''}
                  onClick={() => !delMode && setLightbox(i)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: delMode ? 'default' : 'pointer', display: 'block' }}
                />
                {delMode && (
                  <button
                    onClick={() => deletePhoto(i)}
                    style={{ position: 'absolute', top: 5, right: 5, width: 26, height: 26, borderRadius: '50%', border: 'none', background: CC.bad, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Icon name="x" size={12} color="#fff" sw={3} />
                  </button>
                )}
              </div>
              {isAdmin ? (
                <input
                  value={p.title}
                  onChange={(e) => {
                    const next = photos.map((ph, j) => j === i ? { ...ph, title: e.target.value } : ph);
                    setPhotos(next);
                  }}
                  onBlur={(e) => updateTitle(i, e.target.value)}
                  placeholder="Agregar título…"
                  style={{ border: 'none', borderBottom: `1.5px solid ${CC.line}`, background: 'transparent', fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.ink, padding: '3px 2px', outline: 'none', width: '100%' }}
                />
              ) : p.title ? (
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, paddingLeft: 2 }}>{p.title}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `1.5px dashed ${CC.line}`, background: 'transparent', borderRadius: 12, padding: '12px', cursor: busy ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.muted, letterSpacing: 0.4, opacity: busy ? 0.6 : 1, marginBottom: 16 }}
          >
            <Icon name="plus" size={17} color={CC.muted} sw={2.5} />{busy ? 'Subiendo…' : 'Agregar fotos'}
          </button>
        </>
      )}

      {lightbox !== null && (
        <Lightbox photos={photos} startIdx={lightbox} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
