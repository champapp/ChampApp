import { CC, Icon } from '../../ui';
import { useVotePoll } from '../../lib/queries';

// Tarjeta de encuesta para el jugador: muestra la pregunta, opciones y resultados.
export function PlayerPollCard({ poll, votes, playerId }) {
  const vote = useVotePoll();
  if (!poll || !playerId) return null;

  const myVote = votes.find((v) => v.poll_id === poll.id && v.player_id === playerId);
  const myIdx = myVote?.option_idx ?? null;
  const total = votes.filter((v) => v.poll_id === poll.id).length;

  function castVote(idx) {
    if (myIdx === idx) return;
    vote.mutate({ poll_id: poll.id, player_id: playerId, option_idx: idx });
  }

  return (
    <div style={{ background: 'linear-gradient(150deg, #EEF3FF, #E6EEFF)', border: `1.5px solid rgba(14,58,92,0.18)`, borderRadius: 16, padding: '13px 14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="poll" size={15} color="#fff" sw={2.2} />
        </div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.navy, lineHeight: 1.2 }}>{poll.question}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {(poll.options || []).map((opt, i) => {
          const count = votes.filter((v) => v.poll_id === poll.id && v.option_idx === i).length;
          const pct = total ? count / total : 0;
          const isMyChoice = myIdx === i;
          const voted = myIdx !== null;

          return (
            <button
              key={i}
              onClick={() => castVote(i)}
              disabled={vote.isPending}
              style={{
                position: 'relative', overflow: 'hidden', width: '100%', border: `1.5px solid ${isMyChoice ? CC.navy : CC.line}`, borderRadius: 10, padding: '8px 12px', background: isMyChoice ? 'rgba(14,58,92,0.08)' : '#fff', cursor: 'pointer', textAlign: 'left',
              }}
            >
              {voted && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, background: isMyChoice ? 'rgba(14,58,92,0.12)' : 'rgba(14,58,92,0.05)', borderRadius: 8, transition: 'width 0.4s ease' }} />
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {isMyChoice && <Icon name="check" size={13} color={CC.navy} sw={2.8} />}
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: isMyChoice ? 700 : 500, fontSize: 14, color: CC.ink }}>{opt}</span>
                </div>
                {voted && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13, color: CC.muted }}>{count}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {total > 0 && (
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10.5, color: 'rgba(14,58,92,0.5)', marginTop: 8 }}>
          {total} respuesta{total !== 1 ? 's' : ''}{myIdx !== null ? ' · Tu voto: ' + poll.options[myIdx] : ''}
        </div>
      )}
    </div>
  );
}
