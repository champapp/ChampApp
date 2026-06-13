// "Dispositivo recordado": una vez que alguien hace login en este navegador,
// guardamos quién es (para mostrar su nombre/foto en la pantalla de PIN) sin
// guardar el PIN ni ningún token. Si no hay nada guardado, se muestra el
// login completo (usuario + PIN).
const KEY = 'champ_remembered_device';

export function getRememberedDevice() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function rememberDevice(info) {
  try {
    localStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    // localStorage no disponible (modo privado, etc.) - no es crítico
  }
}

export function forgetDevice() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ver rememberDevice
  }
}
