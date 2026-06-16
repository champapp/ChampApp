import { useState } from 'react';
import { CC, Icon, SectionTitle, Chip, Empty, Toast } from '../../ui';
import { CATS, todayISO, matchesForCat } from '../../lib/domain';
import { useMatches } from '../../lib/queries';
import { useToast } from '../../lib/useToast';
import { MatchCard } from './MatchCard';
import { MatchEditSheet } from './MatchEditSheet';
import { MatchRsvpSheet } from './MatchRsvpSheet';
import { AdminLineups } from './lineups/AdminLineups';

// Pestaña "Partidos" del admin: lista, crea, edita y elimina partidos por categoría.
export function MatchesScreen() {
  const [toast, showToast] = useToast();
  const matchesQ = useMatches();
  const [catId, setCatId] = useState('all');
  const [edit, setEdit] = useState(null); // {match, isNew}
  const [rsvpM, setRsvpM] = useState(null);

  if (matchesQ.isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Barlow, sans-serif', color: CC.muted }}>Cargando…</div>;
  }

  const today = todayISO();
  const all = matchesForCat(matchesQ.data, catId);
  const upcoming = all.filter((m) => m.date >= today);
  const past = all.filter((m) => m.date < today).reverse();

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="whistle" action={
        <button onClick={() => setEdit({ isNew: true })} style={{ border: 'none', background: CC.gold, color: CC.navy900, padding: '6px 13px 6px 10px', borderRadius: 9, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="plus" size={15} color={CC.navy900} sw={2.7} />Nuevo
        </button>
      }>Partidos · {all.length}</SectionTitle>

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        <Chip active={catId === 'all'} onClick={() => setCatId('all')}>Todas</Chip>
        {CATS.map((c) => <Chip key={c.id} active={c.id === catId} onClick={() => setCatId(c.id)}>{c.id}</Chip>)}
      </div>

      <AdminLineups toast={showToast} />

      {upcoming.length > 0 && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: CC.muted, textTransform: 'uppercase', margin: '2px 0 9px' }}>Próximos</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {upcoming.map((m) => <MatchCard key={m.id} m={m} admin onEdit={(mm) => setEdit({ match: mm })} onRsvp={setRsvpM} toast={showToast} />)}
      </div>
      {upcoming.length === 0 && <Empty t="Sin partidos próximos para este filtro" />}

      {past.length > 0 && (<>
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: CC.faint, textTransform: 'uppercase', margin: '20px 0 9px' }}>Jugados</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {past.map((m) => <MatchCard key={m.id} m={m} admin onEdit={(mm) => setEdit({ match: mm })} onRsvp={setRsvpM} toast={showToast} />)}
        </div>
      </>)}

      {edit && <MatchEditSheet match={edit.match} isNew={edit.isNew} onClose={() => setEdit(null)} toast={showToast} />}
      {rsvpM && <MatchRsvpSheet match={rsvpM} onClose={() => setRsvpM(null)} />}

      <Toast msg={toast} />
    </div>
  );
}
