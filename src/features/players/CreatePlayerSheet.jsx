import { useState } from 'react';
import { CC, Icon, Field, TextInput, SelectInput } from '../../ui';
import { CATS, catById, PS_DIVISIONS } from '../../lib/domain';
import { useCreatePlayer } from '../../lib/queries';

function PinInput({ value, onChange, placeholder = '••••' }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <TextInput
        type={show ? 'text' : 'password'}
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder={placeholder}
        autoComplete="off"
        style={{ paddingRight: 40 }}
      />
      <button type="button" onClick={() => setShow((s) => !s)} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: CC.muted, padding: 8, display: 'flex' }}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}

export function CreatePlayerSheet({ onClose, onCreated, toast }) {
  const createMutation = useCreatePlayer();

  const [f, setF] = useState({
    nombre: '', apellido: '', cat: 'PS', sub: '', division: '',
    username: '', pin1: '', pin2: '',
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const cat = catById(f.cat);
  const subs = cat?.subs ?? [];

  function changeCat(v) {
    const c = catById(v);
    setF((s) => ({
      ...s,
      cat: v,
      sub: c && c.subs.length ? c.subs[0] : '',
      division: '',
    }));
  }

  function save() {
    if (!f.nombre.trim() || !f.apellido.trim()) { toast('Ingresá nombre y apellido'); return; }
    if (!f.username.trim()) { toast('Ingresá el usuario de acceso'); return; }
    if (!/^[\w.\-]+$/.test(f.username.trim())) { toast('El usuario solo puede tener letras, números, puntos y guiones'); return; }
    if (f.pin1.length !== 4) { toast('El PIN debe tener 4 dígitos'); return; }
    if (f.pin1 !== f.pin2) { toast('Los PIN no coinciden'); return; }

    createMutation.mutate({
      nombre: f.nombre.trim(),
      apellido: f.apellido.trim(),
      cat: f.cat,
      sub: f.sub || null,
      division: f.division || null,
      username: f.username.trim().toLowerCase(),
      pin: f.pin1,
    }, {
      onSuccess: () => { onCreated && onCreated(); onClose(); toast('Jugador creado'); },
      onError: (err) => {
        if (err.message?.includes('already registered') || err.message?.includes('already exists') || err.code === '23505') {
          toast('Ese usuario ya está en uso');
        } else {
          toast('No se pudo crear el jugador');
        }
      },
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={20} color={CC.navy} sw={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Nuevo jugador</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>

        {/* body */}
        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Nombre" half><TextInput value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Juan" autoFocus /></Field>
            <Field label="Apellido" half><TextInput value={f.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Ej: Pérez" /></Field>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Categoría" half>
              <SelectInput value={f.cat} onChange={(e) => changeCat(e.target.value)}>
                {CATS.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.full}</option>)}
              </SelectInput>
            </Field>
            {f.cat === 'PS' ? (
              <Field label="División" half>
                <SelectInput value={f.division} onChange={(e) => set('division', e.target.value)}>
                  <option value="">—</option>
                  {PS_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </SelectInput>
              </Field>
            ) : (
              <Field label="Subcategoría" half>
                <SelectInput value={f.sub} onChange={(e) => set('sub', e.target.value)}>
                  {subs.length === 0 && <option value="">—</option>}
                  {subs.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${CC.line}`, paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
              <Icon name="lock" size={17} color={CC.navy} sw={2.3} />
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16.5, color: CC.ink, textTransform: 'uppercase', letterSpacing: 0.3 }}>Acceso</span>
            </div>
            <Field label="Usuario de acceso">
              <TextInput
                value={f.username}
                onChange={(e) => set('username', e.target.value.toLowerCase())}
                placeholder="Ej: j.perez"
                style={{ fontFamily: 'ui-monospace, monospace' }}
                autoCapitalize="none"
              />
            </Field>
            <div style={{ height: 10 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="PIN (4 dígitos)" half><PinInput value={f.pin1} onChange={(v) => set('pin1', v)} /></Field>
              <Field label="Confirmar PIN" half><PinInput value={f.pin2} onChange={(v) => set('pin2', v)} placeholder="••••" /></Field>
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>Cancelar</button>
          <button onClick={save} disabled={createMutation.isPending} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />{createMutation.isPending ? 'Creando…' : 'Crear jugador'}
          </button>
        </div>
      </div>
    </div>
  );
}
