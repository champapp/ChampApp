import { useState, useEffect } from 'react';
import { CC, Icon } from '../../ui';
import { supabase } from '../../lib/supabaseClient';

const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function fmtMatchDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return `${SHORT_DAYS[day]} ${d} ${SHORT_MONTHS[m - 1]}`;
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

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 999, padding: '7px 14px', backdropFilter: 'blur(6px)',
      }}>
        <Icon name="whistle" size={13} color={CC.gold} sw={2.2} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3 }}>
          {fmtMatchDate(match.date)}
        </span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, color: CC.gold, letterSpacing: 0.2 }}>
          vs {match.rival}
        </span>
        {match.time && (
          <>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {match.time}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
