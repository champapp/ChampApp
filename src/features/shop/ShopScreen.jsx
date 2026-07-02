import { useState } from 'react';
import { CC, Icon, Card, Chip, Empty, Toast } from '../../ui';
import { useToast } from '../../lib/useToast';
import { SHOP_CATEGORIES, shopCatOf } from '../../lib/domain';
import { useShopItems, useDeleteShopItem, useSwapShopSort } from '../../lib/queries';
import { ShopCard } from './ShopCard';
import { ShopProductDetail } from './ShopProductDetail';
import { ShopItemEditor } from './ShopItemEditor';
import { ShopQuickStock } from './ShopQuickStock';
import { AdminOrdersSheet } from './AdminOrdersSheet';
import { MyOrdersSheet } from './MyOrdersSheet';

function pillBtn(active) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 11, padding: '8px 14px', cursor: 'pointer',
    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5, letterSpacing: 0.3,
    border: active ? '1.5px solid rgba(255,255,255,0.25)' : '1.5px solid rgba(255,255,255,0.2)',
    background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)', color: '#fff',
  };
}

// Catálogo de la Champa Shop. En modo admin permite administrar productos,
// vender y reponer stock. Para jugadores permite reservar y ver sus pedidos.
export function ShopScreen({ isAdmin, player }) {
  const [toast, showToast] = useToast();
  const itemsQ = useShopItems();
  const del = useDeleteShopItem();
  const swap = useSwapShopSort();
  const [editing, setEditing] = useState(false);
  const [builder, setBuilder] = useState(null); // { item } | true
  const [detailId, setDetailId] = useState(null);
  const [quickStock, setQuickStock] = useState(false);
  const [catF, setCatF] = useState('all');
  const [adminOrders, setAdminOrders] = useState(false);
  const [myOrders, setMyOrders] = useState(false);

  if (itemsQ.isLoading) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>;
  }

  const items = itemsQ.data ?? [];
  const canEdit = isAdmin && editing;
  // En modo vista (jugadores y admin sin editar) los más nuevos van primero;
  // en modo admin-edición se respeta el orden manual (sort ASC).
  const displayItems = canEdit ? items : [...items].sort((a, b) => b.id - a.id);
  const detailItem = items.find((x) => x.id === detailId);

  function handleDelete(id) {
    del.mutate(id, { onSuccess: () => showToast('Producto eliminado') });
  }
  function handleMove(item, dir) {
    const idx = items.indexOf(item);
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    swap.mutate({ a: item, b: items[j] });
  }

  function grid(list) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {list.map((it) => {
          const idx = items.indexOf(it);
          return (
            <ShopCard
              key={it.id} item={it} editing={canEdit} first={idx === 0} last={idx === items.length - 1}
              onOpen={() => setDetailId(it.id)} onEdit={() => setBuilder({ item: it })} onDelete={() => handleDelete(it.id)}
              onMove={(d) => handleMove(it, d)}
            />
          );
        })}
      </div>
    );
  }

  let body;
  if (displayItems.length === 0) {
    body = (
      <Card pad={28} style={{ textAlign: 'center' }}>
        <div style={{ color: CC.faint, marginBottom: 10, display: 'flex', justifyContent: 'center' }}><Icon name="bag" size={36} /></div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, letterSpacing: 0.3 }}>Todavía no hay productos</div>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.muted, marginTop: 4 }}>{canEdit ? 'Tocá "Nuevo" para cargar el primero.' : 'Pronto vas a poder ver la indumentaria acá.'}</div>
      </Card>
    );
  } else if (catF !== 'all') {
    const list = displayItems.filter((it) => shopCatOf(it) === catF);
    body = list.length ? grid(list) : <Empty t={'Sin productos en "' + catF + '"'} />;
  } else {
    const cats = SHOP_CATEGORIES.filter((c) => displayItems.some((it) => shopCatOf(it) === c));
    if (cats.length <= 1) {
      body = grid(displayItems);
    } else {
      body = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cats.map((c) => {
            const list = displayItems.filter((it) => shopCatOf(it) === c);
            return (
              <div key={c}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, letterSpacing: 0.5, color: CC.navy900, background: CC.gold, padding: '2px 10px', borderRadius: 6, textTransform: 'uppercase' }}>{c}</span>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted }}>{list.length} producto{list.length === 1 ? '' : 's'}</span>
                  <div style={{ flex: 1, height: 1, background: CC.line }} />
                </div>
                {grid(list)}
              </div>
            );
          })}
        </div>
      );
    }
  }

  return (
    <div style={{ padding: '8px 16px 16px' }}>
      <div style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 16, background: `linear-gradient(150deg, ${CC.navy}, ${CC.navy900})`, color: '#fff', position: 'relative' }}>
        <div style={{ position: 'absolute', right: -24, top: -20, color: 'rgba(249,178,51,0.12)', pointerEvents: 'none' }}><Icon name="bag" size={120} color="rgba(249,178,51,0.12)" sw={1.5} /></div>
        <div style={{ padding: '16px 16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Icon name="bag" size={18} color={CC.gold} sw={2.3} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, color: CC.gold, textTransform: 'uppercase' }}>Champa Shop</span>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1 }}>Indumentaria del club</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 5 }}>Tocá un producto para ver fotos en grande, talles, precio y stock.</div>

          {isAdmin && (
            <div style={{ marginTop: 13 }}>
              {!editing ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setEditing(true)} style={pillBtn(false)}>
                    <Icon name="edit" size={14} color={CC.gold} sw={2.2} />Administrar productos
                  </button>
                  <button onClick={() => setAdminOrders(true)} style={pillBtn(false)}>
                    <Icon name="bag" size={14} color={CC.gold} sw={2.2} />Pedidos
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setQuickStock(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: CC.gold, color: CC.navy900, borderRadius: 11, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5, letterSpacing: 0.3 }}>
                    <Icon name="bag" size={15} color={CC.navy900} sw={2.4} />Venta rápida
                  </button>
                  <button onClick={() => setAdminOrders(true)} style={pillBtn(true)}>
                    <Icon name="bag" size={15} color="#fff" sw={2.4} />Pedidos
                  </button>
                  <button onClick={() => setBuilder(true)} style={pillBtn(true)}>
                    <Icon name="plus" size={15} color="#fff" sw={2.6} />Nuevo
                  </button>
                  <button onClick={() => setEditing(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', borderRadius: 11, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}>Listo</button>
                </div>
              )}
            </div>
          )}
          {!isAdmin && player && (
            <div style={{ marginTop: 13 }}>
              <button onClick={() => setMyOrders(true)} style={pillBtn(false)}>
                <Icon name="bag" size={14} color={CC.gold} sw={2.2} />Mis pedidos
              </button>
            </div>
          )}
          {canEdit && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 9 }}>"Venta rápida" mueve el stock al instante. Tocá un producto para editarlo.</div>}
        </div>
      </div>

      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          <Chip active={catF === 'all'} onClick={() => setCatF('all')}>Todas</Chip>
          {SHOP_CATEGORIES.map((c) => <Chip key={c} active={catF === c} onClick={() => setCatF(c)}>{c}</Chip>)}
        </div>
      )}

      {body}

      {detailItem && (
        <ShopProductDetail
          item={detailItem} editing={canEdit}
          onEdit={() => { setDetailId(null); setBuilder({ item: detailItem }); }}
          onClose={() => setDetailId(null)} toast={showToast}
          player={!isAdmin ? player : undefined}
        />
      )}
      {quickStock && <ShopQuickStock items={items} onClose={() => setQuickStock(false)} toast={showToast} />}
      {builder && <ShopItemEditor item={builder.item} items={items} onClose={() => setBuilder(null)} toast={showToast} />}
      {adminOrders && <AdminOrdersSheet onClose={() => setAdminOrders(false)} toast={showToast} />}
      {myOrders && player && <MyOrdersSheet player={player} onClose={() => setMyOrders(false)} />}
      <Toast msg={toast} />
    </div>
  );
}
