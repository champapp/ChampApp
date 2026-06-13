import { useEffect, useState } from 'react';
import { CC, Icon, Toggle, Toast } from '../../ui';
import { useAuth } from '../../features/auth/useAuth';
import { useToast } from '../../lib/useToast';
import { getPushStatus, subscribePush, unsubscribePush } from '../../lib/push';

const MESSAGES = {
  unsupported: 'Este navegador no soporta notificaciones push.',
  denied: 'Bloqueaste las notificaciones. Para activarlas, habilitalas en la configuración del navegador para este sitio.',
};

export function NotificationSettingsSheet({ onClose }) {
  const { session, player } = useAuth();
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => {
    getPushStatus().then(setStatus);
  }, []);

  async function onToggle(next) {
    setBusy(true);
    try {
      if (next) {
        await subscribePush({ session, player });
        setStatus('subscribed');
        showToast('Notificaciones activadas');
      } else {
        await unsubscribePush();
        setStatus('unsubscribed');
        showToast('Notificaciones desactivadas');
      }
    } catch (err) {
      setStatus(await getPushStatus());
      showToast(err.message || 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  }

  const checked = status === 'subscribed';
  const disabled = busy || status === 'loading' || status === 'unsupported' || status === 'denied';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(7,24,38,0.55)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: CC.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${CC.line}` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: CC.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bell" size={20} color="#fff" sw={2.2} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 21, color: CC.ink, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0.3 }}>Notificaciones</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(14,58,92,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={CC.navy} sw={2.4} /></button>
        </div>

        <div style={{ padding: '16px 16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 14, padding: '14px 14px', boxShadow: '0 1px 2px rgba(14,34,53,0.04), 0 6px 18px rgba(14,34,53,0.05)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 15, color: CC.ink }}>Notificaciones push</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 2 }}>
                Comunicados, partidos, alineaciones y alertas de documentación.
              </div>
            </div>
            <Toggle checked={checked} onChange={onToggle} disabled={disabled} />
          </div>
          {(status === 'unsupported' || status === 'denied') && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: CC.muted, marginTop: 10 }}>
              {MESSAGES[status]}
            </div>
          )}
        </div>
      </div>
      <Toast msg={toast} />
    </div>
  );
}
