import { useState } from 'react';
import { CC, Icon } from '../../ui';
import { GymManageSheet } from './GymManageSheet';

// Botón chico que abre el editor de mediciones de gimnasio de un jugador.
export function GymEditButton({ player, marks, toast }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: CC.gold, color: CC.navy900, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>
        <Icon name="edit" size={14} color={CC.navy900} sw={2.4} />Editar mediciones
      </button>
      {open && <GymManageSheet player={player} marks={marks} onClose={() => setOpen(false)} toast={toast} />}
    </>
  );
}
