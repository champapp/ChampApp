import { CC, Icon, Card } from '../../ui';
import { ShopGallery } from './ShopGallery';

function shopFab(bg) {
  return { width: 26, height: 26, borderRadius: '50%', border: 'none', background: bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' };
}

// Tarjeta de producto en la grilla. En modo admin muestra controles de
// orden, edición y borrado.
export function ShopCard({ item, editing, first, last, onOpen, onEdit, onDelete, onMove }) {
  const totalStock = (item.sizes || []).reduce((a, s) => a + (s.stock || 0), 0);
  const avail = (item.sizes || []).filter((s) => s.stock > 0).map((s) => s.size);

  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onOpen}>
        <ShopGallery photos={item.photos} />
        {editing && (
          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
            {onMove && <button onClick={(e) => { e.stopPropagation(); onMove(-1); }} disabled={first} style={shopFab(first ? 'rgba(7,36,61,0.3)' : CC.navy)}><Icon name="chevUp" size={14} color="#fff" sw={2.6} /></button>}
            {onMove && <button onClick={(e) => { e.stopPropagation(); onMove(1); }} disabled={last} style={shopFab(last ? 'rgba(7,36,61,0.3)' : CC.navy)}><Icon name="chevDown" size={14} color="#fff" sw={2.6} /></button>}
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={shopFab(CC.navy)}><Icon name="edit" size={13} color="#fff" sw={2.3} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={shopFab(CC.bad)}><Icon name="x" size={14} color="#fff" sw={2.5} /></button>
          </div>
        )}
        {totalStock === 0 && <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(7,36,61,0.82)', color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 0.5, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase' }}>Sin stock</div>}
      </div>
      <div style={{ padding: '8px 10px 10px', cursor: 'pointer' }} onClick={onOpen}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, letterSpacing: 0.2, lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          {item.price != null && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.goldDeep, whiteSpace: 'nowrap' }}>${item.price}</span>}
          <span style={{ flex: 1, fontFamily: 'Barlow, sans-serif', fontSize: 11, color: totalStock ? CC.muted : CC.bad, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
            {totalStock ? (avail.length ? avail.join(' · ') : totalStock + ' u.') : 'agotado'}
          </span>
        </div>
      </div>
    </Card>
  );
}
