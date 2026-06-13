import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { CC, Icon } from '../../ui';

const OUTPUT_SIZE = 480;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToFile(imageSrc, area, fileName) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(new File([blob], fileName, { type: 'image/jpeg' })), 'image/jpeg', 0.9);
  });
}

const zoomBtn = {
  width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${CC.line}`, background: '#fff',
  color: CC.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, lineHeight: 1,
};

// Hoja para ajustar el zoom/encuadre circular de una foto antes de subirla.
export function PhotoCropSheet({ file, onCancel, onConfirm }) {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => setArea(croppedAreaPixels), []);

  function cancel() {
    URL.revokeObjectURL(imageSrc);
    onCancel();
  }

  async function confirm() {
    if (!area) return;
    setBusy(true);
    const cropped = await cropToFile(imageSrc, area, file.name);
    URL.revokeObjectURL(imageSrc);
    onConfirm(cropped);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={cancel} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.7)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Ajustar foto</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Arrastrá para mover y usá el control para acercar o alejar</div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: 'min(62vw, 360px)', background: '#0b1b29' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={3}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div style={{ padding: '14px 16px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.1) * 100) / 100))} style={zoomBtn} aria-label="Alejar">−</button>
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <button onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.1) * 100) / 100))} style={zoomBtn} aria-label="Acercar">+</button>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button onClick={cancel} disabled={busy} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>Cancelar</button>
          <button onClick={confirm} disabled={busy || !area} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: busy || !area ? 0.6 : 1 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />{busy ? 'Procesando…' : 'Usar foto'}
          </button>
        </div>
      </div>
    </div>
  );
}
