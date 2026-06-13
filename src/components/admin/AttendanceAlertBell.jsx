import { useState } from 'react';
import { CC, Icon, Avatar, fmtDate } from '../../ui';
import { usePlayers, usePractices, useAttendance, useMatches, useRsvp, useGymChecks } from '../../lib/queries';
import { playerHistory, consecutiveAbsences, attendanceAlerts } from '../../lib/domain';

const SETTINGS_KEY = 'champ_alarm_settings';

function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return { threshold: raw?.threshold ?? 3, contacted: raw?.contacted ?? {} };
  } catch {
    return { threshold: 3, contacted: {} };
  }
}

function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

const stepBtn = {
  width: 26, height: 26, borderRadius: 8, border: 'none', background: '#fff', cursor: 'pointer',
  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.navy, lineHeight: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(14,34,53,0.1)',
};

// Hoja desplegable con la lista de jugadores con N+ faltas consecutivas.
function AlarmSheet({ alerts, threshold, contactedCount, onSetThreshold, onSetContacted, onClearContacted, onClose, onOpenPlayer }) {
  const has = alerts.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 16px 13px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: has ? 'rgba(224,82,78,0.12)' : 'rgba(30,158,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <Icon name={has ? 'bell' : 'check'} size={21} color={has ? CC.bad : CC.good} sw={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1 }}>Alarma de inasistencias</div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: has ? CC.bad : CC.muted, marginTop: 3 }}>
              {has ? `${alerts.length} jugador${alerts.length > 1 ? 'es' : ''} con ${threshold}+ faltas seguidas` : `Sin jugadores con ${threshold}+ faltas seguidas`}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="x" size={18} color={CC.navy} sw={2.4} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '14px 16px max(20px, env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: `1.5px solid ${CC.line}`, borderRadius: 12, padding: '10px 12px', marginBottom: has ? 14 : 0 }}>
            <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, fontWeight: 600, color: CC.muted }}>Avisar a partir de</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(14,58,92,0.06)', borderRadius: 10, padding: 3 }}>
                <button onClick={() => onSetThreshold(threshold - 1)} style={stepBtn}>−</button>
                <div style={{ minWidth: 28, textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 19, color: CC.ink, lineHeight: 1 }}>{threshold}</div>
                <button onClick={() => onSetThreshold(threshold + 1)} style={stepBtn}>+</button>
              </div>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, fontWeight: 600, color: CC.muted }}>faltas</span>
            </div>
          </div>

          {has ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 2px 2px' }}>
                <Icon name="check" size={13} color={CC.muted} sw={2.5} />
                <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted }}>Marcá a quienes ya contactaste para sacarlos de la lista.</span>
              </div>
              {alerts.map((a) => (
                <div key={a.player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${CC.line}`, borderRadius: 12, background: '#fff', padding: '9px 11px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetContacted(a.player.id, true); }}
                    title="Marcar como contactado"
                    style={{ width: 26, height: 26, borderRadius: 8, border: `2px solid ${CC.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Icon name="check" size={15} color="rgba(14,58,92,0.25)" sw={2.6} />
                  </button>
                  <button
                    onClick={() => { onClose(); onOpenPlayer && onOpenPlayer(a.player.id); }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', border: 'none', background: 'transparent', padding: 0, textAlign: 'left', minWidth: 0 }}
                  >
                    <Avatar name={a.player.name} photo={a.player.photo_url} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14.5, color: CC.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.player.name}</div>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11.5, color: CC.muted, marginTop: 1 }}>{a.player.cat}{a.player.sub ? ' ' + a.player.sub : ''} · última falta {fmtDate(a.lastDate)}</div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(224,82,78,0.1)', color: CC.bad, borderRadius: 999, padding: '4px 10px', flexShrink: 0 }}>
                      <Icon name="alert" size={13} color={CC.bad} sw={2.5} />
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>{a.count} faltas</span>
                    </span>
                  </button>
                </div>
              ))}
              {contactedCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted }}>{contactedCount} ya contactado{contactedCount > 1 ? 's' : ''}</span>
                  <button onClick={onClearContacted} style={{ border: 'none', background: 'transparent', color: CC.navy, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5, letterSpacing: 0.3 }}>Restablecer</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '26px 10px 16px' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(30,158,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Icon name="check" size={26} color={CC.good} sw={2.4} />
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: CC.muted }}>Ningún jugador alcanza el umbral de faltas seguidas.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Campana de alarma de inasistencias para el header del admin: muestra un
// contador de jugadores con faltas consecutivas y, al tocarla, despliega
// el detalle (AlarmSheet) con opción de marcar contactados y ajustar el umbral.
export function AttendanceAlertBell({ onOpenPlayer }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);

  const playersQ = usePlayers();
  const practicesQ = usePractices();
  const attendanceQ = useAttendance();
  const matchesQ = useMatches();
  const rsvpQ = useRsvp();
  const gymChecksQ = useGymChecks();

  const loading = [playersQ, practicesQ, attendanceQ, matchesQ, rsvpQ, gymChecksQ].some((q) => q.isLoading);
  if (loading) return null;

  const players = playersQ.data ?? [];
  const historyByPlayer = new Map(players.map((p) => [p.id, playerHistory({
    practices: practicesQ.data ?? [],
    attendance: attendanceQ.data ?? [],
    matches: matchesQ.data ?? [],
    rsvp: rsvpQ.data ?? [],
    gymChecks: gymChecksQ.data ?? [],
    player: p,
  })]));

  const contactedIds = new Set(Object.keys(settings.contacted || {}).filter((id) => settings.contacted[id]).map(Number));
  const alerts = attendanceAlerts({ players, historyByPlayer, threshold: settings.threshold, contactedIds });
  const contactedCount = players.filter((p) =>
    settings.contacted?.[p.id] && consecutiveAbsences(historyByPlayer.get(p.id) || []).count >= settings.threshold
  ).length;

  function setThreshold(v) {
    const next = { ...settings, threshold: Math.max(2, Math.min(6, v)) };
    setSettings(next); saveSettings(next);
  }
  function setContacted(id, val) {
    const contacted = { ...settings.contacted };
    if (val) contacted[id] = true; else delete contacted[id];
    const next = { ...settings, contacted };
    setSettings(next); saveSettings(next);
  }
  function clearContacted() {
    const next = { ...settings, contacted: {} };
    setSettings(next); saveSettings(next);
  }

  const n = alerts.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Alarma de inasistencias"
        style={{
          position: 'relative', width: 38, height: 38, borderRadius: 11, border: 'none',
          background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <Icon name="bell" size={18} color="#fff" sw={2.2} />
        {n > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
            background: CC.bad, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${CC.navy}`, boxSizing: 'content-box',
          }}>{n}</span>
        )}
      </button>
      {open && (
        <AlarmSheet
          alerts={alerts}
          threshold={settings.threshold}
          contactedCount={contactedCount}
          onSetThreshold={setThreshold}
          onSetContacted={setContacted}
          onClearContacted={clearContacted}
          onClose={() => setOpen(false)}
          onOpenPlayer={onOpenPlayer}
        />
      )}
    </>
  );
}
