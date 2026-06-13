import { useEffect, useRef, useState } from 'react';
import { CC, Icon } from '../../ui';

// ── Persistencia (localStorage, por jugador) ────────────────
function loadFeedConf(key) {
  try {
    const r = JSON.parse(localStorage.getItem(key));
    if (r && Array.isArray(r.order)) return { order: r.order, hidden: Array.isArray(r.hidden) ? r.hidden : [] };
  } catch {
    // ignore
  }
  return { order: [], hidden: [] };
}
function saveFeedConf(key, conf) {
  try { localStorage.setItem(key, JSON.stringify(conf)); } catch {
    // ignore
  }
}
function mergeOrder(saved, available) {
  const set = new Set(available);
  const out = saved.filter((x) => set.has(x));
  available.forEach((x) => { if (!out.includes(x)) out.push(x); });
  return out;
}
function feedBtn(disabled, active) {
  return {
    width: 30, height: 30, borderRadius: 8, border: 'none',
    background: active ? 'rgba(224,82,78,0.12)' : 'rgba(14,58,92,0.05)',
    cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, opacity: disabled ? 0.5 : 1,
  };
}

// ════════════════════════════════════════════════════════════
// FeedBoard — tablero reordenable genérico
// ════════════════════════════════════════════════════════════
export function FeedBoard({ storageKey, widgets, title }) {
  const byId = {};
  widgets.forEach((w) => { byId[w.id] = w; });
  const available = widgets.map((w) => w.id);

  const [conf, setConf] = useState(() => {
    const c = loadFeedConf(storageKey);
    return { order: mergeOrder(c.order, available), hidden: c.hidden.filter((x) => available.includes(x)) };
  });
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState(null);

  const order = mergeOrder(conf.order, available);
  const hiddenSet = new Set(conf.hidden);

  const rowRefs = useRef({});
  const drag = useRef(null);
  const orderRef = useRef(order);
  useEffect(() => { orderRef.current = order; });

  function persist(next) { setConf(next); saveFeedConf(storageKey, next); }
  function commitOrder(newOrder) { persist({ order: newOrder, hidden: conf.hidden }); }
  function toggleHide(id) {
    const h = new Set(conf.hidden);
    h.has(id) ? h.delete(id) : h.add(id);
    persist({ order: conf.order.length ? conf.order : order, hidden: [...h] });
  }
  function move(id, dir) {
    const arr = order.slice();
    const i = arr.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    arr.splice(j, 0, arr.splice(i, 1)[0]);
    commitOrder(arr);
  }

  // ── Drag reorder (pointer) ──
  function gap() {
    const ids = orderRef.current;
    if (ids.length < 2) return 12;
    const a = rowRefs.current[ids[0]];
    const b = rowRefs.current[ids[1]];
    if (!a || !b) return 12;
    return Math.max(4, b.getBoundingClientRect().top - a.getBoundingClientRect().bottom);
  }
  function startDrag(e, id) {
    if (!editing) return;
    e.preventDefault();
    const ids = orderRef.current.slice();
    const rects = {};
    ids.forEach((x) => { const el = rowRefs.current[x]; if (el) rects[x] = el.getBoundingClientRect(); });
    drag.current = { id, startY: e.clientY, ids, rects, g: gap(), newArr: ids.slice() };
    setDragId(id);
    const el = rowRefs.current[id];
    if (el) el.style.transition = 'none';
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag, { once: true });
  }
  function moveDrag(e) {
    const st = drag.current;
    if (!st) return;
    e.preventDefault();
    const dy = e.clientY - st.startY;
    const grabbedCenter = (st.rects[st.id].top + st.rects[st.id].height / 2) + dy;
    const others = st.ids.filter((x) => x !== st.id);
    let ins = 0;
    others.forEach((oid) => { const r = st.rects[oid]; if (r && r.top + r.height / 2 < grabbedCenter) ins++; });
    const newArr = others.slice();
    newArr.splice(ins, 0, st.id);
    st.newArr = newArr;
    const firstTop = st.rects[st.ids[0]].top;
    let acc = firstTop;
    const newTop = {};
    newArr.forEach((id) => { newTop[id] = acc; acc += (st.rects[id] ? st.rects[id].height : 0) + st.g; });
    st.ids.forEach((id) => {
      const el = rowRefs.current[id];
      if (!el) return;
      if (id === st.id) {
        el.style.transform = `translateY(${dy}px)`;
        el.style.zIndex = 60;
        el.style.boxShadow = '0 14px 32px rgba(7,36,61,0.22)';
      } else {
        el.style.transform = `translateY(${(newTop[id] - st.rects[id].top).toFixed(1)}px)`;
      }
    });
  }
  function endDrag() {
    window.removeEventListener('pointermove', moveDrag);
    const st = drag.current;
    drag.current = null;
    setDragId(null);
    if (!st) return;
    st.ids.forEach((id) => {
      const el = rowRefs.current[id];
      if (el) { el.style.transition = 'none'; el.style.transform = ''; el.style.zIndex = ''; el.style.boxShadow = ''; }
    });
    if (st.newArr && st.newArr.join(',') !== st.ids.join(',')) commitOrder(st.newArr);
    requestAnimationFrame(() => {
      st.ids.forEach((id) => { const el = rowRefs.current[id]; if (el) el.style.transition = ''; });
    });
  }

  const visibleCount = order.filter((id) => !hiddenSet.has(id)).length;

  return (
    <div>
      {/* barra de control */}
      {!editing ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button onClick={() => setEditing(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: `1.5px solid ${CC.line}`, background: '#fff', borderRadius: 10, padding: '6px 12px 6px 10px' }}>
            <Icon name="sliders" size={15} color={CC.navy} sw={2.2} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, color: CC.navy, letterSpacing: 0.2 }}>Personalizar</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: CC.navy, borderRadius: 14, padding: '10px 12px', marginBottom: 14, boxShadow: '0 6px 18px rgba(7,36,61,0.2)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="grip" size={18} color={CC.gold} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: 0.2, lineHeight: 1 }}>{title || 'Editando feed'}</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Arrastrá ⠿ para mover · tocá el ojo para ocultar</div>
          </div>
          <button onClick={() => setEditing(false)} style={{ border: 'none', background: CC.gold, color: CC.navy900, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 0.3, flexShrink: 0 }}>Listo</button>
        </div>
      )}

      {/* feed */}
      <div style={{ position: 'relative' }}>
        {order.map((id, idx) => {
          const w = byId[id];
          if (!w) return null;
          const isHidden = hiddenSet.has(id);
          if (!editing && isHidden) return null;
          return (
            <div key={id} ref={(el) => { rowRefs.current[id] = el; }} style={{ marginBottom: 12, position: 'relative', transition: 'transform .16s cubic-bezier(.2,.8,.2,1)', willChange: 'transform' }}>
              {editing ? (
                <div style={{ border: `1.5px solid ${dragId === id ? CC.gold : CC.line}`, borderRadius: 18, overflow: 'hidden', background: '#fff', opacity: isHidden ? 0.55 : 1 }}>
                  <div onPointerDown={(e) => startDrag(e, id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: isHidden ? 'rgba(14,58,92,0.04)' : 'rgba(249,178,51,0.1)', cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>
                    <Icon name="grip" size={18} color={CC.navy} />
                    <Icon name={w.icon} size={15} color={CC.navy700} sw={2.2} />
                    <span style={{ flex: 1, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5, color: CC.ink, letterSpacing: 0.2, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.label}{isHidden ? ' · oculto' : ''}</span>
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={() => move(id, -1)} disabled={idx === 0} style={feedBtn(idx === 0)}><Icon name="chevUp" size={16} color={idx === 0 ? CC.faint : CC.navy} sw={2.4} /></button>
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={() => move(id, 1)} disabled={idx === order.length - 1} style={feedBtn(idx === order.length - 1)}><Icon name="chevDown" size={16} color={idx === order.length - 1 ? CC.faint : CC.navy} sw={2.4} /></button>
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={() => toggleHide(id)} style={feedBtn(false, isHidden)}><Icon name={isHidden ? 'eyeOff' : 'eye'} size={16} color={isHidden ? CC.bad : CC.good} sw={2.1} /></button>
                  </div>
                  <div style={{ padding: 10, pointerEvents: 'none' }}>{w.node}</div>
                </div>
              ) : w.node}
            </div>
          );
        })}
        {editing && visibleCount === 0 && (
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, textAlign: 'center', padding: '8px 0 14px' }}>Todas las tarjetas están ocultas. Tocá el ojo para mostrarlas.</div>
        )}
      </div>
    </div>
  );
}
