import { useState } from 'react';
import { CC, Icon, Card, Chip, fmtDate } from '../../ui';
import { CATS, messageStatus } from '../../lib/domain';
import { useMessages, usePlayers, useUpsertMessage, useDeleteMessage } from '../../lib/queries';

const STATUS_COLORS = { activo: CC.good, programado: CC.gold, finalizado: CC.faint };

function msgInput() {
  return { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '10px 11px', fontFamily: 'Barlow, sans-serif', fontSize: 14.5, color: CC.ink, background: '#fff' };
}
function msgIconBtn() {
  return { width: 30, height: 30, borderRadius: 8, border: `1px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
}
function blankDraft() {
  return { title: '', body: '', cats: [], start_date: '', end_date: '' };
}

// Comunicados (admin): componer y administrar avisos para los jugadores.
export function AdminMessages({ toast }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const messagesQ = useMessages();
  const playersQ = usePlayers();
  const upsert = useUpsertMessage();
  const del = useDeleteMessage();

  if (messagesQ.isLoading || playersQ.isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>;
  }

  const players = playersQ.data ?? [];
  const msgs = (messagesQ.data ?? []).slice().sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
  const activeN = msgs.filter((m) => messageStatus(m) === 'activo').length;
  const activeCats = CATS.filter((c) => players.some((p) => p.cat === c.id));

  function startNew() { setDraft(blankDraft()); setOpen(true); }
  function edit(m) {
    const a = m.cats || { type: 'all' };
    const cats = a.type === 'cats' ? (a.cats || []).slice() : (a.type === 'cat' ? [a.cat] : []);
    setDraft({ id: m.id, title: m.title, body: m.body || '', cats, start_date: m.start_date || '', end_date: m.end_date || '' });
    setOpen(true);
  }
  function toggleCat(id) {
    setDraft((d) => {
      const has = d.cats.includes(id);
      return { ...d, cats: has ? d.cats.filter((c) => c !== id) : d.cats.concat(id) };
    });
  }
  function save() {
    if (!draft.title.trim() && !draft.body.trim()) return;
    const audience = (!draft.cats || !draft.cats.length) ? { type: 'all' } : { type: 'cats', cats: draft.cats };
    upsert.mutate({
      id: draft.id,
      title: draft.title.trim() || 'Comunicado',
      body: draft.body.trim(),
      cats: audience,
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
    }, {
      onSuccess: () => { setDraft(null); toast?.('Comunicado publicado ✓'); },
    });
  }
  function remove(id) {
    del.mutate(id, { onSuccess: () => toast?.('Comunicado eliminado') });
  }

  return (
    <Card pad={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(14,58,92,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="megaphone" size={20} color={CC.navy} sw={2.1} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Comunicados</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 3 }}>
            {msgs.length ? (activeN + ' activo' + (activeN === 1 ? '' : 's') + ' · ' + msgs.length + ' en total') : 'Enviá avisos al perfil de los jugadores'}
          </div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {!draft && (
            <button onClick={startNew} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px dashed ${CC.line}`, background: '#fff', color: CC.navy, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15.5, letterSpacing: 0.3, marginBottom: msgs.length ? 12 : 0 }}>
              <Icon name="plus" size={16} color={CC.navy} sw={2.6} />Nuevo comunicado
            </button>
          )}

          {draft && (
            <div style={{ background: CC.paper, borderRadius: 14, padding: 12, marginBottom: 12, border: `1.5px solid ${CC.line}` }}>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Título (ej: Suspensión de práctica)" style={msgInput()} />
              <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Mensaje para los jugadores…" rows={3} style={{ ...msgInput(), resize: 'vertical', marginTop: 8, lineHeight: 1.4 }} />
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', margin: '10px 0 5px' }}>
                Destinatarios <span style={{ color: CC.faint, fontWeight: 600 }}>(podés elegir varias categorías)</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Chip active={!draft.cats.length} onClick={() => setDraft({ ...draft, cats: [] })}>Todo el club</Chip>
                {activeCats.map((c) => <Chip key={c.id} active={draft.cats.includes(c.id)} onClick={() => toggleCat(c.id)}>{c.id}</Chip>)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', marginBottom: 4 }}>Desde</div>
                  <input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} style={msgInput()} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', marginBottom: 4 }}>Hasta</div>
                  <input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} style={msgInput()} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => setDraft(null)} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.muted, padding: '11px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>Cancelar</button>
                <button onClick={save} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '11px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="check" size={16} color={CC.navy900} sw={2.6} />Publicar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msgs.map((m) => {
              const st = messageStatus(m);
              const a = m.cats || { type: 'all' };
              const audLabel = a.type === 'cats' ? (a.cats || []).join(' · ') : (a.type === 'cat' ? a.cat : 'Todo el club');
              return (
                <div key={m.id} style={{ border: `1px solid ${CC.line}`, borderRadius: 12, padding: '11px 12px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: STATUS_COLORS[st], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</span>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: STATUS_COLORS[st], textTransform: 'uppercase' }}>{st}</span>
                  </div>
                  {m.body && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted, lineHeight: 1.35, marginBottom: 7 }}>{m.body}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: CC.faint }}>
                      {audLabel}{m.start_date ? ' · ' + fmtDate(m.start_date) : ''}{m.end_date ? ' → ' + fmtDate(m.end_date) : ''}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => edit(m)} style={msgIconBtn()}><Icon name="edit" size={14} color={CC.navy} sw={2.3} /></button>
                    <button onClick={() => remove(m.id)} style={msgIconBtn()}><Icon name="x" size={15} color={CC.bad} sw={2.5} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
