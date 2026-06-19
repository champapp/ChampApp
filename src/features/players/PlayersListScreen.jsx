import { useState } from 'react';
import { CC, Icon, Card, Chip, Segmented, Avatar, CatBadge, SectionTitle, Empty, Toast, fmtPct, rateColor } from '../../ui';
import { InjuryDot } from '../../components/player/InjuryDot';
import { CATS, playerAttendance } from '../../lib/domain';
import {
  usePlayers, usePlayersArchived, usePractices, useAttendance, useMatches, useRsvp, useGymChecks, useActiveInjuries, useUpdatePlayer, useDeletePlayer,
} from '../../lib/queries';
import { useToast } from '../../lib/useToast';
import { BulkPhotoUploader } from './BulkPhotoUploader';
import { CreatePlayerSheet } from './CreatePlayerSheet';

function PlayersLoading() {
  return (
    <div style={{ padding: 16 }}>
      <Card>
        <div style={{ fontFamily: 'Barlow, sans-serif', color: CC.muted, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Cargando jugadores…</div>
      </Card>
    </div>
  );
}

export function PlayersListScreen({ onOpenPlayer }) {
  const [catId, setCatId] = useState('all');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('active');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelId, setConfirmDelId] = useState(null);
  const [toast, showToast] = useToast();

  const playersQ = usePlayers();
  const archivedQ = usePlayersArchived();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const gymChecksQ = useGymChecks();
  const injuriesQ = useActiveInjuries();
  const updateMutation = useUpdatePlayer();
  const deleteMutation = useDeletePlayer();

  const queries = [playersQ, archivedQ, practicesQ, attendanceQ, matchesQ, rsvpQ, gymChecksQ, injuriesQ];
  if (queries.some((x) => x.isLoading)) return <PlayersLoading />;

  const players = playersQ.data ?? [];
  const archivedPlayers = archivedQ.data ?? [];
  const practices = practicesQ.data ?? [];
  const attendance = attendanceQ.data ?? [];
  const matches = matchesQ.data ?? [];
  const rsvp = rsvpQ.data ?? [];
  const gymChecks = gymChecksQ.data ?? [];
  const injuryByPlayer = new Map((injuriesQ.data ?? []).map((i) => [i.player_id, i]));

  const archived = tab === 'archived';
  let list = archived ? archivedPlayers : players;
  if (!archived && catId !== 'all') list = list.filter((p) => p.cat === catId);
  if (q.trim()) list = list.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  list = list.slice().sort((a, b) => a.name.localeCompare(b.name));

  function reactivate(p) {
    updateMutation.mutate({ id: p.id, patch: { deleted_at: null } }, {
      onSuccess: () => showToast('Jugador reactivado'),
      onError: () => showToast('No se pudo reactivar'),
    });
  }

  function deletePlayer(p) {
    deleteMutation.mutate({ id: p.id, authUserId: p.auth_user_id ?? null }, {
      onSuccess: () => { setConfirmDelId(null); showToast('Jugador eliminado'); },
      onError: () => showToast('No se pudo eliminar'),
    });
  }

  return (
    <div style={{ padding: '4px 16px 20px' }}>
      <SectionTitle icon="players" action={
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: CC.gold, color: CC.navy, padding: '6px 13px 6px 10px', borderRadius: 9, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}>
            <Icon name="plus" size={15} color={CC.navy} sw={2.5} />Nuevo
          </button>
          <button onClick={() => setBulkOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'rgba(14,58,92,0.07)', color: CC.navy, padding: '6px 13px 6px 10px', borderRadius: 9, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14.5 }}>
            <Icon name="camera" size={15} color={CC.navy} sw={2.4} />Fotos
          </button>
        </div>
      }>{'Jugadores · ' + players.length}</SectionTitle>

      <div style={{ marginBottom: 12 }}>
        <Segmented value={tab} onChange={setTab} options={[
          { id: 'active', label: 'Activos' },
          { id: 'archived', label: 'Archivados · ' + archivedPlayers.length },
        ]} />
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: CC.faint }}><Icon name="search" size={18} /></div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jugador..." style={{
          width: '100%', boxSizing: 'border-box', border: `1.5px solid ${CC.line}`, borderRadius: 12,
          padding: '11px 12px 11px 38px', fontFamily: 'Barlow, sans-serif', fontSize: 15, color: CC.ink, background: '#fff',
        }} />
      </div>

      {!archived && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
          <Chip active={catId === 'all'} onClick={() => setCatId('all')}>Todas</Chip>
          {CATS.map((c) => <Chip key={c.id} active={c.id === catId} onClick={() => setCatId(c.id)}>{c.id}</Chip>)}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.length === 0 && <Empty t={archived ? 'No hay jugadores archivados' : 'No se encontraron jugadores'} />}
        {list.map((p) => {
          if (archived) {
            const confirmingDel = confirmDelId === p.id;
            return (
              <Card key={p.id} pad={11}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={p.name} photo={p.photo_url} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 15.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <CatBadge id={p.cat} sub={p.sub} />
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: CC.faint }}>{p.username}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={() => reactivate(p)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
                      <Icon name="restore" size={14} color={CC.navy} sw={2.4} />Reactivar
                    </button>
                    <button onClick={() => setConfirmDelId(confirmingDel ? null : p.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, border: `1.5px solid ${CC.bad}`, background: 'rgba(224,82,78,0.06)', color: CC.bad, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
                      <Icon name="trash" size={14} color={CC.bad} sw={2.4} />Eliminar
                    </button>
                  </div>
                </div>
                {confirmingDel && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(224,82,78,0.07)', borderRadius: 10, border: `1px solid ${CC.bad}` }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: CC.ink, marginBottom: 9 }}>
                      ¿Eliminar permanentemente a <b>{p.name}</b>? Esta acción no se puede deshacer.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setConfirmDelId(null)} style={{ flex: 1, border: `1.5px solid ${CC.line}`, background: '#fff', color: CC.navy, padding: '9px', borderRadius: 9, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>Cancelar</button>
                      <button onClick={() => deletePlayer(p)} disabled={deleteMutation.isPending} style={{ flex: 1, border: 'none', background: CC.bad, color: '#fff', padding: '9px', borderRadius: 9, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>
                        {deleteMutation.isPending ? 'Eliminando…' : 'Sí, eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          }
          const att = playerAttendance({ practices, attendance, matches, rsvp, gymChecks, player: p });
          return (
            <Card key={p.id} pad={11} onClick={() => onOpenPlayer(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={p.name} photo={p.photo_url} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 15.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  <InjuryDot injury={injuryByPlayer.get(p.id)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <CatBadge id={p.cat} sub={p.sub} />
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: CC.faint }}>{p.username}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: rateColor(att.rate), lineHeight: 1 }}>{fmtPct(att.rate)}</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: CC.faint }}>asist.</div>
              </div>
              <div style={{ color: CC.faint }}><Icon name="chevron" size={18} /></div>
            </Card>
          );
        })}
      </div>
      <Toast msg={toast} />
      {bulkOpen && <BulkPhotoUploader players={players} onClose={() => setBulkOpen(false)} />}
      {createOpen && (
        <CreatePlayerSheet
          onClose={() => setCreateOpen(false)}
          onCreated={() => setTab('active')}
          toast={showToast}
        />
      )}
    </div>
  );
}
