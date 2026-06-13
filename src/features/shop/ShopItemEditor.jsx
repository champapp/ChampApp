import { useRef, useState } from 'react';
import { CC, Icon, Field, TextInput } from '../../ui';
import { SHOP_CATEGORIES, shopCatOf } from '../../lib/domain';
import { useUpsertShopItem, useUploadShopPhoto } from '../../lib/queries';

const shopStep = { width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.navy, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

function blankSizes() {
  return [{ size: 'S', stock: 0 }, { size: 'M', stock: 0 }, { size: 'L', stock: 0 }, { size: 'XL', stock: 0 }];
}

// Alta o edición de un producto: nombre, categoría, fotos (por URL),
// descripción, precio, talles y stock.
export function ShopItemEditor({ item, items, onClose, onSaved, toast }) {
  const [f, setF] = useState(() => item ? {
    id: item.id, name: item.name || '', descr: item.descr || '', price: item.price ?? '', category: shopCatOf(item),
    photos: (item.photos || []).slice(), sizes: (item.sizes || []).map((s) => ({ ...s })),
  } : { name: '', descr: '', price: '', category: 'Equipo de juego', photos: [], sizes: blankSizes() });
  const [photoUrl, setPhotoUrl] = useState('');
  const upsert = useUpsertShopItem();
  const uploadPhoto = useUploadShopPhoto();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }

  function addPhoto() {
    const url = photoUrl.trim();
    if (!url) return;
    set('photos', f.photos.concat(url));
    setPhotoUrl('');
  }

  function pickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    uploadPhoto.mutate(file, {
      onSuccess: (url) => set('photos', f.photos.concat(url)),
      onError: () => toast?.('No se pudo subir la foto'),
    });
  }
  function setSize(i, k, v) { setF((p) => { const s = p.sizes.slice(); s[i] = { ...s[i], [k]: v }; return { ...p, sizes: s }; }); }
  function addSize() { setF((p) => ({ ...p, sizes: p.sizes.concat({ size: '', stock: 0 }) })); }
  function delSize(i) { setF((p) => ({ ...p, sizes: p.sizes.filter((_, j) => j !== i) })); }

  function save() {
    if (!f.name.trim()) { toast?.('Poné un nombre al producto'); return; }
    const sizes = f.sizes.filter((s) => String(s.size).trim() !== '').map((s) => ({ size: String(s.size).trim().toUpperCase(), stock: Math.max(0, parseInt(s.stock, 10) || 0) }));
    const payload = {
      id: f.id,
      name: f.name.trim(),
      descr: f.descr.trim(),
      price: f.price === '' ? null : Number(f.price),
      category: f.category || 'Otros',
      photos: f.photos,
      sizes,
    };
    if (!item) {
      const minSort = items.reduce((m, it) => Math.min(m, it.sort || 0), 0);
      payload.sort = minSort - 1;
    }
    upsert.mutate(payload, {
      onSuccess: () => { onSaved?.(); onClose(); toast?.(item ? 'Producto actualizado' : 'Producto agregado'); },
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={item ? 'edit' : 'plus'} size={20} color="#fff" sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{item ? 'Editar producto' : 'Nuevo producto'}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Fotos, talles y stock</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', marginBottom: 7 }}>Fotos del producto</div>
            {f.photos.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                {f.photos.map((ph, i) => (
                  <div key={i} style={{ position: 'relative', width: 84, height: 84, borderRadius: 12, overflow: 'hidden', background: `center/cover url(${ph})`, border: `1px solid ${CC.line}` }}>
                    <button onClick={() => set('photos', f.photos.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(7,36,61,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={12} color="#fff" sw={2.6} /></button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={pickFile} style={{ display: 'none' }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={pickFile} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadPhoto.isPending} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px solid ${CC.navy}`, background: '#fff', color: CC.navy, borderRadius: 11, padding: '10px 0', cursor: uploadPhoto.isPending ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}>
                <Icon name="box" size={16} color={CC.navy} sw={2.4} />{uploadPhoto.isPending ? 'Subiendo…' : 'Elegir archivo'}
              </button>
              <button onClick={() => cameraInputRef.current?.click()} disabled={uploadPhoto.isPending} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px solid ${CC.navy}`, background: '#fff', color: CC.navy, borderRadius: 11, padding: '10px 0', cursor: uploadPhoto.isPending ? 'default' : 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}>
                <Icon name="camera" size={16} color={CC.navy} sw={2.4} />Usar cámara
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextInput value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="…o pegá la URL de una foto (https://…)" style={{ flex: 1 }} />
              <button onClick={addPhoto} style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1.5px solid ${CC.navy}`, background: '#fff', color: CC.navy, borderRadius: 11, padding: '0 14px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}><Icon name="plus" size={14} color={CC.navy} sw={2.6} />Agregar</button>
            </div>
          </div>

          <Field label="Nombre del producto"><TextInput value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej: Camiseta titular 2026" /></Field>
          <Field label="Categoría">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SHOP_CATEGORIES.map((c) => (
                <button key={c} onClick={() => set('category', c)} style={{
                  border: `1.5px solid ${f.category === c ? CC.navy : CC.line}`, borderRadius: 999, padding: '7px 13px', cursor: 'pointer',
                  background: f.category === c ? CC.navy : '#fff', color: f.category === c ? '#fff' : CC.ink,
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
                }}>{c}</button>
              ))}
            </div>
          </Field>
          <Field label="Descripción (opcional)"><TextInput value={f.descr} onChange={(e) => set('descr', e.target.value)} placeholder="Ej: Modelo home, tela dry-fit" /></Field>
          <Field label="Precio (opcional)"><TextInput type="number" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="Ej: 1200" /></Field>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase' }}>Talles y stock</span>
              <button onClick={addSize} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: CC.navy, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}><Icon name="plus" size={14} color={CC.navy} sw={2.6} />Talle</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {f.sizes.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input value={s.size} onChange={(e) => setSize(i, 'size', e.target.value)} placeholder="Talle" style={{ width: 72, boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '9px 10px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.ink, textAlign: 'center', background: '#fff' }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '4px 6px 4px 12px', background: '#fff' }}>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, flex: 1 }}>Stock</span>
                    <button onClick={() => setSize(i, 'stock', Math.max(0, (parseInt(s.stock, 10) || 0) - 1))} style={shopStep}>−</button>
                    <input value={s.stock} onChange={(e) => setSize(i, 'stock', e.target.value.replace(/\D/g, ''))} style={{ width: 42, border: 'none', textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, color: CC.ink, background: 'transparent' }} />
                    <button onClick={() => setSize(i, 'stock', (parseInt(s.stock, 10) || 0) + 1)} style={shopStep}>+</button>
                  </div>
                  <button onClick={() => delSize(i)} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={14} color={CC.bad} sw={2.5} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={save} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="check" size={18} color={CC.navy900} sw={2.6} />{item ? 'Guardar' : 'Agregar'}</button>
        </div>
      </div>
    </div>
  );
}
