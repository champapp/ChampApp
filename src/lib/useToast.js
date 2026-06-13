import { useRef, useState } from 'react';

// Mensaje breve que aparece abajo de la pantalla y se oculta solo.
export function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  function showToast(text) {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }
  return [msg, showToast];
}
