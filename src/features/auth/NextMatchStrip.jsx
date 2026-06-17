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
      .select('date, time, rival')
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
  if (match.time) parts.push(match.time);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
      <div style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 14, padding: '8px 16px', backdropFilter: 'blur(6px)',
      }}>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11, color: CC.gold, letterSpacing: 1, textTransform: 'uppercase' }}>
          1ª
        </span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 13.5, color: 'rgba(255,255,255,0.88)', letterSpacing: 0.2, whiteSpace: 'nowrap' }}>
          {parts.join(' · ')}
        </span>
      </div>
    </div>
  );
}
