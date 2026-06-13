import { useRef, useState } from 'react';
import { CC, Icon, Field, TextInput, SelectInput, Avatar } from '../../ui';
import { CATS, catById, POSITIONS } from '../../lib/domain';
import { useUpdatePlayer, useUploadPlayerPhoto, useChangePin } from '../../lib/queries';
import { AdminDocsEditor } from './AdminDocsEditor';
import { PhotoCropSheet } from './PhotoCropSheet';

const photoBtn = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  border: `1.5px solid ${CC.navy}`, background: '#fff', color: CC.navy, borderRadius: 11,
  padding: '10px 0', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5,
};

// Campo de PIN de 4 dígitos con botón para mostrar/ocultar.
function PinInput({ value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <TextInput
        type={show ? 'text' : 'password'}
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder="••••"
        autoComplete="off"
        style={{ paddingRight: 40 }}
      />
      <button type="button" onClick={() => setShow((s) => !s)} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: CC.muted, padding: 8, display: 'flex' }} aria-label={show ? 'Ocultar' : 'Mostrar'}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}

// Hoja de edición del perfil de un jugador. Admin y jugador (modo `selfEdit`)
// editan los mismos datos básicos, físicos, de contacto/emergencia y la foto
// de perfil. Solo el admin puede editar el objetivo de gimnasio, el usuario
// de acceso y archivar al jugador; solo el jugador (selfEdit) puede cambiar
// su propio PIN de acceso.
export function EditPlayerSheet({ player, onClose, onSaved, onDeleted, toast, selfEdit = false }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [cropFile, setCropFile] = useState(null);
  const updateMutation = useUpdatePlayer();
  const uploadPhoto = useUploadPlayerPhoto();
  const changePinMutation = useChangePin();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [f, setF] = useState({
    nombre: player.nombre,
    apellido: player.apellido,
    cat: player.cat,
    sub: player.sub,
    birthDate: player.birth_date || '',
    dorsalKey: player.dorsal != null ? String(player.dorsal) : '',
    peso: player.peso ?? '',
    talla: player.talla ?? '',
    objetivo: player.objetivo || '',
    username: player.username,
    phone: player.phone || '',
    emergencyContact: player.emergency_contact || '',
    emergencyMedical: player.emergency_medical || '',
    photoUrl: player.photo_url || '',
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const cat = catById(f.cat);
  const subs = cat ? cat.subs : [];

  function changeCat(v) {
    const c = catById(v);
    setF((s) => ({ ...s, cat: v, sub: c && c.subs.length ? (s.sub && c.subs.includes(s.sub) ? s.sub : c.subs[0]) : null }));
  }

  function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCropFile(file);
  }

  function confirmCrop(croppedFile) {
    setCropFile(null);
    uploadPhoto.mutate({ playerId: player.id, file: croppedFile }, {
      onSuccess: (url) => set('photoUrl', url),
      onError: () => toast('No se pudo subir la foto'),
    });
  }

  function save() {
    if (!f.nombre.trim() || !f.apellido.trim()) { toast('Ingresá nombre y apellido'); return; }
    if (!selfEdit && !f.username.trim()) { toast('Ingresá el usuario de acceso'); return; }

    const peso = f.peso === '' ? null : parseFloat(f.peso);
    const talla = f.talla === '' ? null : parseFloat(f.talla);
    const imc = peso && talla ? Math.round((peso / Math.pow(talla / 100, 2)) * 10) / 10 : null;
    const birthYear = f.birthDate ? parseInt(f.birthDate.slice(0, 4), 10) : player.birth_year;
    const posMeta = POSITIONS.find((x) => x.dorsal === parseInt(f.dorsalKey, 10));

    const patch = {
      nombre: f.nombre.trim(), apellido: f.apellido.trim(),
      cat: f.cat, sub: f.sub,
      birth_date: f.birthDate || null, birth_year: birthYear || null,
      peso, talla, imc,
      phone: f.phone.trim() || null,
      emergency_contact: f.emergencyContact.trim() || null,
      emergency_medical: f.emergencyMedical.trim() || null,
      photo_url: f.photoUrl || null,
      pos: posMeta ? posMeta.pos : null,
      pos_short: posMeta ? posMeta.short : null,
      pos_type: posMeta ? posMeta.type : null,
      dorsal: posMeta ? posMeta.dorsal : null,
    };

    if (!selfEdit) {
      patch.objetivo = f.objetivo.trim() || null;
      patch.username = f.username.trim().toLowerCase();
    }

    updateMutation.mutate({ id: player.id, patch }, {
      onSuccess: () => { onSaved && onSaved(); onClose(); toast('Perfil actualizado'); },
      onError: (err) => toast(err.code === '23505' ? 'Ese usuario ya está en uso' : 'No se pudo guardar'),
    });
  }

  function doArchive() {
    updateMutation.mutate({ id: player.id, patch: { deleted_at: new Date().toISOString() } }, {
      onSuccess: () => { onClose(); onDeleted && onDeleted(); toast('Jugador archivado'); },
      onError: () => toast('No se pudo archivar'),
    });
  }

  function changePin() {
    if (pin1.length !== 4 || pin2.length !== 4) { toast('El PIN debe tener 4 dígitos'); return; }
    if (pin1 !== pin2) { toast('Los PIN no coinciden'); return; }
    changePinMutation.mutate({ playerId: player.id, pin: pin1 }, {
      onSuccess: () => { setPin1(''); setPin2(''); toast('PIN actualizado'); },
      onError: () => toast('No se pudo actualizar el PIN'),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="edit" size={20} color="#fff" sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Editar perfil</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>{player.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>
        {/* cuerpo scrollable */}
        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* foto de perfil */}
          <div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 7 }}>Foto de perfil</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={player.name} photo={f.photoUrl} size={64} ring={CC.gold} />
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={pickPhoto} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadPhoto.isPending} style={photoBtn}>
                  <Icon name="box" size={16} color={CC.navy} sw={2.4} />{uploadPhoto.isPending ? 'Subiendo…' : 'Elegir archivo'}
                </button>
                <button onClick={() => cameraInputRef.current?.click()} disabled={uploadPhoto.isPending} style={photoBtn}>
                  <Icon name="camera" size={16} color={CC.navy} sw={2.4} />Usar cámara
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Nombre" half><TextInput value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Juan" /></Field>
            <Field label="Apellido" half><TextInput value={f.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Ej: Pérez" /></Field>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Categoría" half>
              <SelectInput value={f.cat} onChange={(e) => changeCat(e.target.value)}>
                {CATS.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.full}</option>)}
              </SelectInput>
            </Field>
            <Field label="Subcategoría" half>
              <SelectInput value={f.sub || ''} onChange={(e) => set('sub', e.target.value || null)}>
                {subs.length === 0 && <option value="">—</option>}
                {subs.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Fecha de nacimiento" half><TextInput type="date" value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></Field>
            <Field label="Puesto" half>
              <SelectInput value={f.dorsalKey} onChange={(e) => set('dorsalKey', e.target.value)}>
                <option value="">Sin asignar</option>
                {POSITIONS.map((o) => <option key={o.dorsal} value={o.dorsal}>#{o.dorsal} {o.pos}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Peso (kg)" half><TextInput type="number" value={f.peso} onChange={(e) => set('peso', e.target.value)} placeholder="—" /></Field>
            <Field label="Talla (cm)" half><TextInput type="number" value={f.talla} onChange={(e) => set('talla', e.target.value)} placeholder="—" /></Field>
          </div>

          {!selfEdit && (
            <Field label="Objetivo de gimnasio"><TextInput value={f.objetivo} onChange={(e) => set('objetivo', e.target.value)} placeholder="Ej: Ganar masa muscular" /></Field>
          )}

          {/* contacto y emergencia */}
          <div style={{ borderTop: `1px solid ${CC.line}`, paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
              <Icon name="medkit" size={17} color={CC.navy} sw={2.3} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16.5, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 }}>Contacto y emergencia</span>
            </div>
            <Field label="Celular"><TextInput value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Ej: 099 123 456" /></Field>
            <div style={{ height: 10 }} />
            <Field label="Contacto de emergencia"><TextInput value={f.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="Ej: María (mamá) · 099 765 432" /></Field>
            <div style={{ height: 10 }} />
            <Field label="Emergencia médica / cobertura"><TextInput value={f.emergencyMedical} onChange={(e) => set('emergencyMedical', e.target.value)} placeholder="Ej: SEMM · Socio 12345" /></Field>
          </div>

          {selfEdit && <AdminDocsEditor playerId={player.id} />}

          {!selfEdit && (
            <Field label="Usuario de acceso"><TextInput value={f.username} onChange={(e) => set('username', e.target.value)} style={{ fontFamily: 'ui-monospace, monospace' }} /></Field>
          )}

          {/* cambiar PIN de acceso */}
          {selfEdit && (
            <div style={{ borderTop: `1px solid ${CC.line}`, paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
                <Icon name="lock" size={17} color={CC.navy} sw={2.3} />
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16.5, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 }}>Cambiar PIN de acceso</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Field label="Nuevo PIN" half><PinInput value={pin1} onChange={setPin1} /></Field>
                <Field label="Confirmar PIN" half><PinInput value={pin2} onChange={setPin2} /></Field>
              </div>
              <button onClick={changePin} disabled={changePinMutation.isPending} style={{ width: '100%', marginTop: 10, border: 'none', background: CC.navy, color: '#fff', padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="check" size={15} color="#fff" sw={2.6} />{changePinMutation.isPending ? 'Actualizando…' : 'Actualizar PIN'}
              </button>
            </div>
          )}

          {/* archivar jugador */}
          {!selfEdit && (
            <div style={{ borderTop: `1px solid ${CC.line}`, paddingTop: 14 }}>
              {confirmDel ? (
                <div style={{ border: `1.5px solid ${CC.bad}`, borderRadius: 13, padding: 13, background: 'rgba(224,82,78,0.05)' }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.ink, marginBottom: 11, lineHeight: 1.35 }}>¿Archivar a <b>{player.name}</b>? Dejará de aparecer en el plantel y los listados, pero podés reactivarlo más adelante desde la pestaña "Archivados".</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmDel(false)} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '11px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>Cancelar</button>
                    <button onClick={doArchive} style={{ flex: 1, border: 'none', background: CC.bad, color: '#fff', padding: '11px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>Sí, archivar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(true)} style={{ width: '100%', border: `1.5px solid ${CC.bad}`, background: 'rgba(224,82,78,0.06)', color: CC.bad, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="archive" size={16} color={CC.bad} sw={2.6} />Archivar jugador
                </button>
              )}
            </div>
          )}
        </div>
        {/* footer */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>Cancelar</button>
          <button onClick={save} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />Guardar cambios
          </button>
        </div>
      </div>
      {cropFile && <PhotoCropSheet file={cropFile} onCancel={() => setCropFile(null)} onConfirm={confirmCrop} />}
    </div>
  );
}
