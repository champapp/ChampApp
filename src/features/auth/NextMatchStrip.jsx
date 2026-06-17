import { useState, useEffect } from 'react';
import { CC } from '../../ui';
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

  const parts = [fmtMatchDate(match.date), `vs ${match.rival}`];
  if (match.time_primera) parts.push(match.time_primera);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 0,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 999, padding: '7px 14px', backdropFilter: 'blur(6px)',
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13.5, whiteSpace: 'nowrap',
      }}>
        <span style={{ fontWeight: 700, color: CC.gold, letterSpacing: 0.3 }}>1ª</span>
        <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 5px' }}>·</span>
        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: 0.2 }}>{parts.join(' · ')}</span>
      </div>
    </div>
  );
}
