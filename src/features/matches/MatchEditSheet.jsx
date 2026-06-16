import { useState } from 'react';
import { CC, Icon, Field, TextInput, SelectInput } from '../../ui';
import { CATS, HOME_PLACE, PS_DIVS, M17_DIVS } from '../../lib/domain';
import { useUpsertMatch, useDeleteMatch, useVenues, useUpsertVenue } from '../../lib/queries';

function nextSatISO() {
  let d = new Date();
  for (let i = 0; i < 8; i++) { if (d.getDay() === 6) break; d.setDate(d.getDate() + 1); }
  return d.toISOString().slice(0, 10);
}

// localía toggle
function HomeToggle({ home, onChange }) {
  const opt = (val, label, icon) => (
    <button onClick={() => onChange(val)} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
      border: 'none', borderRadius: 10, padding: '10px', transition: 'all .15s',
      background: home === val ? (val ? CC.good : CC.navy) : 'transparent',
      color: home === val ? '#fff' : CC.muted,
      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.3,
    }}>
      <Icon name={icon} size={16} color={home === val ? '#fff' : CC.muted} sw={2.3} />{label}
    </button>
  );
  return (
    <div style={{ display: 'flex', gap: 4, background: 'rgba(14,58,92,0.06)', borderRadius: 13, padding: 4 }}>
      {opt(true, 'Local', 'home')}
      {opt(false, 'Visitante', 'pin')}
    </div>
  );
}

// Autocomplete de canchas de rivales con opción de guardar nueva
function VenueAutocomplete({ value, mapsUrl, onSelect, onMapsUrlChange }) {
  const venuesQ = useVenues();
  const upsertVenue = useUpsertVenue();
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const venues = venuesQ.data || [];
  const filtered = query.length >= 1 ? venues.filter((v) => v.name.toLowerCase().includes(query.toLowerCase())) : venues;
  const exactMatch = venues.find((v) => v.name.toLowerCase() === query.toLowerCase());

  function select(v) {
    setQuery(v.name);
    setOpen(false);
    onSelect(v.name, v.maps_url || '');
  }

  function saveAndSelect() {
    if (!query.trim() || !mapsUrl.trim()) return;
    upsertVenue.mutate({ name: query.trim(), maps_url: mapsUrl.trim() }, {
      onSuccess: () => { setOpen(false); onSelect(query.trim(), mapsUrl.trim()); },
    });
  }

  return (
    <div style={{ position: 'relative' }}>
      <TextInput
        value={query}
        onChange={(e) => { setQuery(e.target.value); onSelect(e.target.value, mapsUrl); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Cancha del rival"
      />
      {open && (filtered.length > 0 || (!exactMatch && query.trim())) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1.5px solid ${CC.line}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
          {filtered.map((v) => (
            <button key={v.id} onClick={() => select(v)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 14px', cursor: 'pointer', fontFamily: 'Barlow, sans-serif', fontSize: 14, color: CC.ink, borderBottom: `1px solid ${CC.line}` }}>
              <div style={{ fontWeight: 600 }}>{v.name}</div>
              {v.maps_url && <div style={{ fontSize: 11, color: CC.faint, marginTop: 2 }}>📍 Mapa guardado</div>}
            </button>
          ))}
          {!exactMatch && query.trim() && (
            <button onClick={() => { setOpen(false); onSelect(query.trim(), mapsUrl); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'rgba(14,58,92,0.04)', padding: '10px 14px', cursor: 'pointer', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.navy }}>
              + Usar "{query.trim()}" (nueva cancha)
            </button>
          )}
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: CC.muted, marginBottom: 4 }}>Link Google Maps (opcional)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextInput value={mapsUrl} onChange={(e) => onMapsUrlChange(e.target.value)} placeholder="https://maps.google.com/..." style={{ flex: 1 }} />
          {!exactMatch && query.trim() && mapsUrl.trim() && (
            <button onClick={saveAndSelect} disabled={upsertVenue.isPending} style={{ flexShrink: 0, border: 'none', background: CC.navy, color: '#fff', borderRadius: 9, padding: '0 12px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13 }}>
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Editor de partido (modal). Crea, edita o elimina un partido.
export function MatchEditSheet({ match, isNew, onClose, toast }) {
  const upsert = useUpsertMatch();
  const del = useDeleteMatch();
  const [confirmDel, setConfirmDel] = useState(false);
  const [f, setF] = useState(() => ({
    id: match ? match.id : null,
    cat: match ? match.cat : 'PS',
    rival: match ? match.rival : '',
    home: match ? !!match.home : true,
    place: match ? match.place : HOME_PLACE,
    date: match ? match.date : nextSatISO(),
    time: match ? (match.time || '') : '15:00',
    time_primera: match ? (match.time_primera || '') : '',
    time_intermedia: match ? (match.time_intermedia || '') : '',
    time_preintermedia: match ? (match.time_preintermedia || '') : '',
    cite_primera: match ? (match.cite_primera || '') : '',
    cite_intermedia: match ? (match.cite_intermedia || '') : '',
    cite_preintermedia: match ? (match.cite_preintermedia || '') : '',
    time_m17: match ? (match.time_m17 || '') : '',
    cite_m17: match ? (match.cite_m17 || '') : '',
    time_m16: match ? (match.time_m16 || '') : '',
    cite_m16: match ? (match.cite_m16 || '') : '',
    comp: match ? match.comp : 'Campeonato Uruguayo',
    cite: match ? (match.cite || '') : '',
    maps_url: match ? (match.maps_url || '') : '',
  }));

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  function setHome(v) { setF((s) => ({ ...s, home: v, place: v ? HOME_PLACE : (s.rival ? 'Cancha de ' + s.rival : s.place), maps_url: v ? '' : s.maps_url })); }
  function setRival(v) { setF((s) => ({ ...s, rival: v, place: s.home ? s.place : ('Cancha de ' + v) })); }

  function save() {
    if (!f.rival.trim()) { toast('Ingresá el rival'); return; }
    const isPS = f.cat === 'PS';
    const isM17 = f.cat === 'M17';
    const data = {
      id: f.id, cat: f.cat, rival: f.rival.trim(), home: f.home,
      place: f.place.trim() || (f.home ? HOME_PLACE : 'A confirmar'), date: f.date,
      time: (isPS || isM17) ? null : f.time,
      time_primera: isPS ? (f.time_primera || null) : null,
      time_intermedia: isPS ? (f.time_intermedia || null) : null,
      time_preintermedia: isPS ? (f.time_preintermedia || null) : null,
      cite_primera: isPS ? (f.cite_primera || null) : null,
      cite_intermedia: isPS ? (f.cite_intermedia || null) : null,
      cite_preintermedia: isPS ? (f.cite_preintermedia || null) : null,
      time_m17: isM17 ? (f.time_m17 || null) : null,
      cite_m17: isM17 ? (f.cite_m17 || null) : null,
      time_m16: isM17 ? (f.time_m16 || null) : null,
      cite_m16: isM17 ? (f.cite_m16 || null) : null,
      comp: f.comp.trim(), cite: (isPS || isM17) ? null : (f.cite || null),
      maps_url: (!f.home && f.maps_url.trim()) ? f.maps_url.trim() : null,
    };
    upsert.mutate(data, {
      onSuccess: () => { onClose(); toast(isNew ? 'Partido creado' : 'Partido actualizado'); },
      onError: () => toast('No se pudo guardar. Probá de nuevo.'),
    });
  }
  function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    del.mutate(f.id, {
      onSuccess: () => { onClose(); toast('Partido eliminado'); },
      onError: () => toast('No se pudo eliminar. Probá de nuevo.'),
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="whistle" size={20} color="#fff" sw={2.3} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>{isNew ? 'Nuevo partido' : 'Editar partido'}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>{isNew ? 'Cargá los datos del partido' : 'vs ' + (match.rival || '')}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Categoría que juega">
            <SelectInput value={f.cat} onChange={(e) => set('cat', e.target.value)}>
              {CATS.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.full}</option>)}
            </SelectInput>
          </Field>
          <Field label="Rival"><TextInput value={f.rival} onChange={(e) => setRival(e.target.value)} placeholder="Ej: San Patricio" /></Field>
          <Field label="Localía"><HomeToggle home={f.home} onChange={setHome} /></Field>
          <Field label="Fecha"><TextInput type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
          {f.cat === 'PS' ? (
            <Field label="Horarios (Plantel Superior) — completá las divisiones que jueguen">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PS_DIVS.map((d) => (
                  <div key={d.key} style={{ border: `1.5px solid ${CC.line}`, borderRadius: 11, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.ink, marginBottom: 6 }}>{d.label}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: CC.muted, marginBottom: 4 }}>Kick off</div>
                        <TextInput type="time" value={f[d.key]} onChange={(e) => set(d.key, e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: CC.muted, marginBottom: 4 }}>Citación</div>
                        <TextInput type="time" value={f[d.citeKey]} onChange={(e) => set(d.citeKey, e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Field>
          ) : f.cat === 'M17' ? (
            <Field label="Horarios (M17) — completá las divisiones que jueguen">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {M17_DIVS.map((d) => (
                  <div key={d.key} style={{ border: `1.5px solid ${CC.line}`, borderRadius: 11, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.ink, marginBottom: 6 }}>{d.label}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: CC.muted, marginBottom: 4 }}>Kick off</div>
                        <TextInput type="time" value={f[d.key]} onChange={(e) => set(d.key, e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color: CC.muted, marginBottom: 4 }}>Citación</div>
                        <TextInput type="time" value={f[d.citeKey]} onChange={(e) => set(d.citeKey, e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Field>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="Kick off" half><TextInput type="time" value={f.time} onChange={(e) => set('time', e.target.value)} /></Field>
              <Field label="Citación" half><TextInput type="time" value={f.cite} onChange={(e) => set('cite', e.target.value)} /></Field>
            </div>
          )}
          {f.home ? (
            <Field label="Lugar / cancha"><TextInput value={f.place} onChange={(e) => set('place', e.target.value)} placeholder="Dónde se juega" /></Field>
          ) : (
            <Field label="Cancha del rival">
              <VenueAutocomplete
                value={f.place}
                mapsUrl={f.maps_url}
                onSelect={(name, url) => setF((s) => ({ ...s, place: name, maps_url: url }))}
                onMapsUrlChange={(url) => set('maps_url', url)}
              />
            </Field>
          )}
          <Field label="Competencia"><TextInput value={f.comp} onChange={(e) => set('comp', e.target.value)} placeholder="Campeonato Uruguayo" /></Field>
          {!isNew && (
            <button onClick={handleDelete} style={{ border: `1.5px solid ${CC.bad}`, background: confirmDel ? CC.bad : 'rgba(224,82,78,0.06)', color: confirmDel ? '#fff' : CC.bad, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="x" size={16} color={confirmDel ? '#fff' : CC.bad} sw={2.5} />{confirmDel ? '¿Seguro? Tocá de nuevo para eliminar' : 'Eliminar partido'}</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${CC.line}`, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17 }}>Cancelar</button>
          <button onClick={save} disabled={upsert.isPending} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '13px', borderRadius: 13, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: upsert.isPending ? 0.7 : 1 }}>
            <Icon name="check" size={18} color={CC.navy900} sw={2.6} />{isNew ? 'Crear partido' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
