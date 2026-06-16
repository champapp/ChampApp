import { useRef, useState } from 'react';
import { CC, Icon, SectionTitle } from '../../ui';
import { useUploadGalleryPhoto, useSavePlayerGallery } from '../../lib/queries';

function Lightbox({ photos, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
        <Icon name="x" size={20} color="#fff" sw={2.5} />
      </button>
      <img
        src={photos[idx]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
      />
      {photos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + photos.length) % photos.length); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          ><Icon name="back" size={20} color="#fff" sw={2.5} /></button>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>{idx + 1} / {photos.length}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % photos.length); }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          ><Icon name="back" size={20} color="#fff" sw={2.5} style={{ transform: 'rotate(180deg)' }} /></button>
        </div>
      )}
    </div>
  );
}

export function PlayerGallery({ player, isAdmin, toast }) {
  const photos = player.gallery_photos ?? [];
  const [lightbox, setLightbox] = useState(null);
  const [delMode, setDelMode] = useState(false);
  const fileRef = useRef();

  const upload = useUploadGalleryPhoto();
  const save = useSavePlayerGallery();

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = [];
    for (const file of files) {
      try {
        const url = await upload.mutateAsync({ playerId: player.id, file });
        urls.push(url);
      } catch {
        toast?.('Error al subir una foto');
      }
    }
    if (urls.length) {
      const next = [...photos, ...urls];
      save.mutate({ playerId: player.id, photos: next }, {
        onSuccess: () => toast?.('Fotos guardadas'),
        onError: () => toast?.('No se pudo guardar'),
      });
    }
    e.target.value = '';
  }

  function deletePhoto(url) {
    const next = photos.filter((p) => p !== url);
    save.mutate({ playerId: player.id, photos: next }, {
      onSuccess: () => { if (!next.length) setDelMode(false); toast?.('Foto eliminada'); },
      onError: () => toast?.('No se pudo eliminar'),
    });
  }

  const busy = upload.isPending || save.isPending;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <SectionTitle icon="camera" style={{ marginBottom: 0 }}>Fotos</SectionTitle>
        {isAdmin && photos.length > 0 && (
          <button
            onClick={() => setDelMode((v) => !v)}
            style={{ background: delMode ? CC.bad : 'rgba(14,58,92,0.07)', border: 'none', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: delMode ? '#fff' : CC.muted, letterSpacing: 0.3 }}
          >{delMode ? 'Listo' : 'Eliminar'}</button>
        )}
      </div>

      {photos.length === 0 && !isAdmin && (
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.faint, marginBottom: 16 }}>Sin fotos aún.</div>
      )}

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
          {photos.map((url, i) => (
            <div key={url} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: 'rgba(14,58,92,0.06)' }}>
              <img
                src={url}
                alt=""
                onClick={() => !delMode && setLightbox(i)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: delMode ? 'default' : 'pointer', display: 'block' }}
              />
              {delMode && (
                <button
                  onClick={() => deletePhoto(url)}
                  style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', border: 'none', background: CC.bad, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Icon name="x" size={12} color="#fff" sw={3} />
                </button>
              )}
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
