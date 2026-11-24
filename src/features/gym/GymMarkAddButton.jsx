import { useState } from 'react';
import { CC, Icon } from '../../ui';
import { GymMarkAddSheet } from './GymMarkAddSheet';

// Botón chico que abre la carga de una marca nueva de gimnasio (jugador).
export function GymMarkAddButton({ player, marks, toast }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: CC.gold, color: CC.navy900, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>
        <Icon name="plus" size={14} color={CC.navy900} sw={2.6} />Cargar marca
      </button>
      {open && <GymMarkAddSheet player={player} marks={marks} onClose={() => setOpen(false)} toast={toast} />}
    </>
  );
}
