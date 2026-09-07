import { useState, useEffect } from 'react';
import { CC, RivalCrest } from '../../ui';
import { rivalCrestSrc, CHAMPAGNAT_CREST } from '../../lib/rivalCrests';
import { supabase } from '../../lib/supabaseClient';

const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fmtMatchDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return `${SHORT_DAYS[day]} ${d}/${m}`;
}

export function NextMatchStrip() {
  const [match, setMatch] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from('matches')
      .select('date, time_primera, rival')
      .eq('cat', 'PS')
      .gte('date', today)
      .order('date', { ascending: true })
      .then(({ data }) => {
        const m = (data || []).find(Boolean);
        if (m) setMatch(m);
      });
  }, []);

  if (!match) return null;

  const rest = [match.time_primera].filter(Boolean).join(' · ');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 999, padding: '6px 14px 6px 7px', backdropFilter: 'blur(6px)',
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13.5, whiteSpace: 'nowrap',
      }}>
        {rivalCrestSrc(match.rival) && <img src={CHAMPAGNAT_CREST} alt="Champagnat" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 5, background: '#fff', padding: 2, flexShrink: 0 }} />}
        <RivalCrest rival={match.rival} size={20} style={{ borderRadius: 5, background: '#fff', padding: 2 }} />
        <span style={{ fontWeight: 700, color: CC.gold, letterSpacing: 0.3 }}>1ª</span>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>·</span>
        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: 0.2 }}>{fmtMatchDate(match.date)} · vs {match.rival}{rest ? ' · ' + rest : ''}</span>
      </div>
    </div>
  );
}
