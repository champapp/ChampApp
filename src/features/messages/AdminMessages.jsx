import { useState, useRef } from 'react';
import { CC, Icon, Card, Chip, fmtDate } from '../../ui';
import { CATS, messageStatus, PS_DIVISIONS, catTokenLabel } from '../../lib/domain';
import { useMessages, usePlayers, useUpsertMessage, useDeleteMessage, useUploadMessageFile, usePolls, useUpsertPoll, useDeletePoll, useAllPollVotes } from '../../lib/queries';

const STATUS_COLORS = { activo: CC.good, programado: CC.gold, finalizado: CC.faint };

function msgInput() {
  return { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 10, padding: '10px 11px', fontFamily: 'Barlow, sans-serif', fontSize: 14.5, color: CC.ink, background: '#fff' };
}
function msgIconBtn() {
  return { width: 30, height: 30, borderRadius: 8, border: `1px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
}
function blankDraft() {
  return { title: '', body: '', cats: [], start_date: '', end_date: '', attachment_url: '', attachment_name: '', attachment_type: '' };
}

// Sección de encuestas rápidas
function PollsSection({ players, toast }) {
  const pollsQ = usePolls();
  const votesQ = useAllPollVotes();
  const upsert = useUpsertPoll();
  const del = useDeletePoll();
  const [form, setForm] = useState(null); // null | {id?, question, options:string[], cats:[]}
  const [confirmDel, setConfirmDel] = useState(null);
  const playersData = players || [];

  const polls = pollsQ.data || [];
  const votes = votesQ.data || [];

  function blankPoll() { return { question: '', options: ['', ''], cats: [] }; }
  function addOption() { setForm((f) => ({ ...f, options: [...f.options, ''] })); }
  function setOption(i, v) { setForm((f) => { const o = [...f.options]; o[i] = v; return { ...f, options: o }; }); }
  function removeOption(i) { setForm((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) })); }
  function toggleCat(id) { setForm((f) => ({ ...f, cats: f.cats.includes(id) ? f.cats.filter((c) => c !== id) : f.cats.concat(id) })); }

  function savePoll() {
    if (!form.question.trim()) return;
    const opts = form.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) { toast?.('Necesitás al menos 2 opciones'); return; }
    upsert.mutate({ id: form.id, question: form.question.trim(), options: opts, cats: form.cats }, {
      onSuccess: () => { setForm(null); toast?.('Encuesta publicada ✓'); },
    });
  }

  function handleDelete(id) {
    if (confirmDel !== id) { setConfirmDel(id); return; }
    del.mutate(id, { onSuccess: () => { setConfirmDel(null); toast?.('Encuesta eliminada'); } });
  }

  function pollResults(poll) {
    const pVotes = votes.filter((v) => v.poll_id === poll.id);
    return (poll.options || []).map((opt, i) => ({
      opt,
      count: pVotes.filter((v) => v.option_idx === i).length,
    }));
  }

  const activeCats = CATS.filter((c) => playersData.some((p) => p.cat === c.id));

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="poll" size={13} color={CC.muted} sw={2.3} />Encuestas rápidas
      </div>

      {!form && (
        <button onClick={() => setForm(blankPoll())} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: `1.5px dashed ${CC.line}`, background: '#fff', color: CC.navy, padding: '10px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5, marginBottom: polls.length ? 10 : 0 }}>
          <Icon name="plus" size={14} color={CC.navy} sw={2.6} />Nueva encuesta
        </button>
      )}

      {form && (
        <div style={{ background: CC.paper, borderRadius: 13, padding: 12, marginBottom: 12, border: `1.5px solid ${CC.line}` }}>
          <input value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} placeholder="Pregunta (ej: ¿Podés ir el sábado?)" style={{ ...msgInput(), marginBottom: 10 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {form.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <input value={opt} onChange={(e) => setOption(i, e.target.value)} placeholder={`Opción ${i + 1}`} style={{ ...msgInput(), flex: 1 }} />
                {form.options.length > 2 && (
                  <button onClick={() => removeOption(i)} style={{ border: 'none', background: 'rgba(224,82,78,0.1)', color: CC.bad, borderRadius: 8, padding: '0 10px', cursor: 'pointer' }}>✕</button>
                )}
              </div>
            ))}
            {form.options.length < 5 && (
              <button onClick={addOption} style={{ border: 'none', background: 'transparent', color: CC.navy, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, textAlign: 'left', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="plus" size={13} color={CC.navy} sw={2.6} />Agregar opción
              </button>
            )}
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', marginBottom: 5 }}>Destinatarios</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            <Chip active={!form.cats.length} onClick={() => setForm((f) => ({ ...f, cats: [] }))}>Todos</Chip>
            {activeCats.map((c) => <Chip key={c.id} active={form.cats.includes(c.id)} onClick={() => toggleCat(c.id)}>{c.id}</Chip>)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setForm(null)} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.muted, padding: '10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>Cancelar</button>
            <button onClick={savePoll} disabled={upsert.isPending} style={{ flex: 1.5, border: 'none', background: CC.gold, color: CC.navy900, padding: '10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: upsert.isPending ? 0.6 : 1 }}>
              <Icon name="check" size={15} color={CC.navy900} sw={2.6} />Publicar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {polls.map((poll) => {
          const results = pollResults(poll);
          const total = results.reduce((s, r) => s + r.count, 0);
          return (
            <div key={poll.id} style={{ border: `1px solid ${CC.line}`, borderRadius: 12, padding: '11px 12px', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <Icon name="poll" size={14} color={CC.navy} sw={2.3} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, color: CC.ink, lineHeight: 1.2 }}>{poll.question}</div>
                <button onClick={() => setForm({ id: poll.id, question: poll.question, options: poll.options || [], cats: poll.cats || [] })} style={msgIconBtn()}><Icon name="edit" size={14} color={CC.navy} sw={2.3} /></button>
                <button onClick={() => handleDelete(poll.id)} style={{ ...msgIconBtn(), background: confirmDel === poll.id ? CC.bad : '#fff', borderColor: CC.bad }}>
                  <Icon name="x" size={14} color={confirmDel === poll.id ? '#fff' : CC.bad} sw={2.5} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {results.map((r, i) => {
                  const pct = total ? r.count / total : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginBottom: 2 }}>
                        <span>{r.opt}</span><span style={{ fontWeight: 700, color: CC.ink }}>{r.count}</span>
                      </div>
                      <div style={{ background: CC.paper, borderRadius: 999, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${pct * 100}%`, height: '100%', background: CC.navy, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint, marginTop: 6 }}>{total} respuesta{total !== 1 ? 's' : ''} · {poll.cats?.length ? poll.cats.join(', ') : 'Todos'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Comunicados (admin): componer y administrar avisos para los jugadores.
export function AdminMessages({ toast }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const messagesQ = useMessages();
  const playersQ = usePlayers();
  const upsert = useUpsertMessage();
  const del = useDeleteMessage();
  const uploadFile = useUploadMessageFile();

  if (messagesQ.isLoading || playersQ.isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>;
  }

  const players = playersQ.data ?? [];
  const msgs = (messagesQ.data ?? []).slice().sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
  const activeN = msgs.filter((m) => messageStatus(m) === 'activo').length;
  const activeCats = CATS.filter((c) => players.some((p) => p.cat === c.id));
  const psDivisions = PS_DIVISIONS.filter((d) => players.some((p) => p.cat === 'PS' && p.division === d));

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
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    uploadFile.mutate(file, {
      onSuccess: (result) => { setDraft((d) => ({ ...d, attachment_url: result.url, attachment_name: result.name, attachment_type: result.type })); setUploading(false); },
      onError: () => { toast?.('Error al subir el archivo'); setUploading(false); },
    });
  }

  function removeAttachment() {
    setDraft((d) => ({ ...d, attachment_url: '', attachment_name: '', attachment_type: '' }));
    if (fileRef.current) fileRef.current.value = '';
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
      attachment_url: draft.attachment_url || null,
      attachment_name: draft.attachment_name || null,
      attachment_type: draft.attachment_type || null,
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
                {psDivisions.map((d) => {
                  const token = `PS:${d}`;
                  return <Chip key={token} active={draft.cats.includes(token)} onClick={() => toggleCat(token)}>PS · {d}</Chip>;
                })}
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
              {/* Adjunto */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: CC.muted, textTransform: 'uppercase', marginBottom: 5 }}>Adjunto (PDF o imagen)</div>
                {draft.attachment_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(14,58,92,0.06)', borderRadius: 10, padding: '8px 11px' }}>
                    <Icon name="file" size={15} color={CC.navy} sw={2.2} />
                    <span style={{ flex: 1, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{draft.attachment_name}</span>
                    <button onClick={removeAttachment} style={{ border: 'none', background: 'transparent', color: CC.bad, cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px dashed ${CC.line}`, background: '#fff', color: CC.navy, borderRadius: 10, padding: '8px 13px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, opacity: uploading ? 0.6 : 1 }}>
                    <Icon name="file" size={14} color={CC.navy} sw={2.3} />{uploading ? 'Subiendo…' : 'Subir archivo'}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => setDraft(null)} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.muted, padding: '11px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>Cancelar</button>
                <button onClick={save} style={{ flex: 1.6, border: 'none', background: CC.gold, color: CC.navy900, padding: '11px', borderRadius: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="check" size={16} color={CC.navy900} sw={2.6} />Publicar
                </button>
              </div>
            </div>
          )}

          <PollsSection players={players} toast={toast} />

          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="megaphone" size={13} color={CC.muted} sw={2.3} />Comunicados
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msgs.map((m) => {
              const st = messageStatus(m);
              const a = m.cats || { type: 'all' };
              const audLabel = a.type === 'cats' ? (a.cats || []).map(catTokenLabel).join(' · ') : (a.type === 'cat' ? a.cat : 'Todo el club');
              return (
                <div key={m.id} style={{ border: `1px solid ${CC.line}`, borderRadius: 12, padding: '11px 12px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: STATUS_COLORS[st], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</span>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: STATUS_COLORS[st], textTransform: 'uppercase' }}>{st}</span>
                  </div>
                  {m.body && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted, lineHeight: 1.35, marginBottom: 7 }}>{m.body}</div>}
                  {m.attachment_url && (
                    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(14,58,92,0.06)', borderRadius: 8, padding: '4px 9px', marginBottom: 6, textDecoration: 'none', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12.5, color: CC.navy }}>
                      <Icon name="file" size={13} color={CC.navy} sw={2.2} />{m.attachment_name || 'Ver adjunto'}
                    </a>
                  )}
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
