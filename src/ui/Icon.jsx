// Set de iconos (stroke), portado de champ-ui.jsx.
export function Icon({ name, size = 22, color = 'currentColor', sw = 2 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 11l9-7 9 7" {...p} /><path d="M5 10v10h14V10" {...p} /></>,
    attendance: <><rect x="5" y="4" width="14" height="17" rx="2" {...p} /><path d="M9 3h6v3H9z" {...p} /><path d="M8.5 11l1.6 1.6L13 9.5" {...p} /><path d="M8.5 16.5h7" {...p} /></>,
    players: <><circle cx="9" cy="8" r="3.2" {...p} /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" {...p} /><path d="M16 6.5a3 3 0 010 5.6M16.5 14c2.4.3 4 2.3 4 5" {...p} /></>,
    stats: <><path d="M4 20V4" {...p} /><path d="M4 20h16" {...p} /><rect x="7" y="12" width="3" height="5" {...p} /><rect x="12" y="8" width="3" height="9" {...p} /><rect x="17" y="5" width="3" height="12" {...p} /></>,
    download: <><path d="M12 4v11" {...p} /><path d="M8 11l4 4 4-4" {...p} /><path d="M5 20h14" {...p} /></>,
    chevron: <path d="M9 6l6 6-6 6" {...p} />,
    megaphone: <><path d="M3 11v2a1 1 0 001 1h2l4 4V6L6 10H4a1 1 0 00-1 1z" {...p} /><path d="M10 6l9-3v18l-9-3" {...p} /><path d="M14 9a4 4 0 010 6" {...p} /></>,
    bag: <><path d="M6 8h12l-1 12H7L6 8z" {...p} /><path d="M9 8V6a3 3 0 016 0v2" {...p} /></>,
    box: <><path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" {...p} /><path d="M3 7l9 4 9-4M12 11v10" {...p} /></>,
    chevDown: <path d="M6 9l6 6 6-6" {...p} />,
    back: <path d="M15 6l-6 6 6 6" {...p} />,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" {...p} /><circle cx="12" cy="13" r="3.2" {...p} /></>,
    plus: <><path d="M12 5v14M5 12h14" {...p} /></>,
    check: <path d="M5 12l4.5 4.5L19 7" {...p} />,
    x: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    calendar: <><rect x="4" y="5" width="16" height="16" rx="2" {...p} /><path d="M4 9h16M8 3v4M16 3v4" {...p} /></>,
    trophy: <><path d="M7 4h10v4a5 5 0 01-10 0z" {...p} /><path d="M7 5H4v1a3 3 0 003 3M17 5h3v1a3 3 0 01-3 3" {...p} /><path d="M12 13v4M9 21h6M10 17h4" {...p} /></>,
    flame: <><path d="M12 3c1 3 4 4 4 8a4 4 0 01-8 0c0-1.5.6-2.4 1.2-3 .2 1 .8 1.5 1.3 1.5C9.7 8.5 9 7 12 3z" {...p} /></>,
    ruler: <><rect x="3" y="8" width="18" height="8" rx="1.5" {...p} transform="rotate(0)" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" {...p} /></>,
    target: <><circle cx="12" cy="12" r="8" {...p} /><circle cx="12" cy="12" r="3.4" {...p} /></>,
    weight: <><path d="M6 9h12l1.5 11h-15z" {...p} /><circle cx="12" cy="6" r="2.2" {...p} /></>,
    edit: <><path d="M5 19h14" {...p} /><path d="M14 5l4 4-9 9H5v-4z" {...p} /></>,
    search: <><circle cx="11" cy="11" r="6" {...p} /><path d="M16 16l4 4" {...p} /></>,
    logout: <><path d="M14 4h4v16h-4" {...p} /><path d="M10 8l-4 4 4 4M6 12h9" {...p} /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" {...p} /><path d="M8 11V8a4 4 0 018 0v3" {...p} /></>,
    shield: <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" {...p} />,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" {...p} />,
    dot: <circle cx="12" cy="12" r="3" fill={color} stroke="none" />,
    filter: <><path d="M4 5h16M7 12h10M10 19h4" {...p} /></>,
    user: <><circle cx="12" cy="8" r="3.6" {...p} /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" {...p} /></>,
    medal: <><circle cx="12" cy="14" r="5" {...p} /><path d="M8.5 9.5L6 3h4l2 4 2-4h4l-2.5 6.5" {...p} /><path d="M12 12.2l.9 1.7 1.9.2-1.4 1.3.4 1.9-1.8-1-1.8 1 .4-1.9-1.4-1.3 1.9-.2z" {...p} /></>,
    clock: <><circle cx="12" cy="12" r="8" {...p} /><path d="M12 8v4l3 2" {...p} /></>,
    pin: <><path d="M12 21c4-4.5 6-7.6 6-10.5A6 6 0 006 10.5C6 13.4 8 16.5 12 21z" {...p} /><circle cx="12" cy="10.5" r="2.3" {...p} /></>,
    bell: <><path d="M6 16V10a6 6 0 0112 0v6l2 2H4z" {...p} /><path d="M10 20a2 2 0 004 0" {...p} /></>,
    alert: <><path d="M12 4l9 16H3z" {...p} /><path d="M12 10v4M12 17.5v.5" {...p} /></>,
    whistle: <><path d="M3 11a4 4 0 014-4h13l-1.5 4A6 6 0 117 11z" {...p} /><circle cx="9" cy="13" r="2.2" {...p} /><path d="M16 7V4h3" {...p} /></>,
    versus: <><path d="M4 6l3 12M10 6L7 18M14 12h6M14 8h6M14 16h4" {...p} /></>,
    grip: <><circle cx="9" cy="6" r="1.4" fill={color} stroke="none" /><circle cx="15" cy="6" r="1.4" fill={color} stroke="none" /><circle cx="9" cy="12" r="1.4" fill={color} stroke="none" /><circle cx="15" cy="12" r="1.4" fill={color} stroke="none" /><circle cx="9" cy="18" r="1.4" fill={color} stroke="none" /><circle cx="15" cy="18" r="1.4" fill={color} stroke="none" /></>,
    eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...p} /><circle cx="12" cy="12" r="3" {...p} /></>,
    eyeOff: <><path d="M4 4l16 16" {...p} /><path d="M9.5 9.6A3 3 0 0014.4 14.5M7 7.3C4.2 8.9 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.4 4.2-1M11 5.6c.3 0 .7-.1 1-.1 6 0 9.5 6.5 9.5 6.5s-.8 1.5-2.3 3" {...p} /></>,
    chevUp: <path d="M6 15l6-6 6 6" {...p} />,
    settings: <><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2v3M12 19v3M5 5l1.5 1.5M17.5 17.5L19 19M2 12h3M19 12h3M5 19l1.5-1.5M17.5 6.5L19 5" {...p} /></>,
    sliders: <><path d="M4 8h10M18 8h2M4 16h2M10 16h10" {...p} /><circle cx="16" cy="8" r="2.2" {...p} /><circle cx="8" cy="16" r="2.2" {...p} /></>,
    medkit: <><rect x="3" y="7" width="18" height="13" rx="2.5" {...p} /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" {...p} /><path d="M12 11v5M9.5 13.5h5" {...p} /></>,
    cake: <><path d="M5 21V13a2 2 0 012-2h10a2 2 0 012 2v8M3 21h18M12 11V8" {...p} /><circle cx="12" cy="5.5" r="1" fill={color} stroke="none" /><path d="M5 16c1.4 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0" {...p} /></>,
    archive: <><rect x="3" y="4" width="18" height="4" rx="1" {...p} /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" {...p} /><path d="M10 12h4" {...p} /></>,
    restore: <><path d="M3 12a9 9 0 109-9" {...p} /><path d="M3 3v6h6" {...p} /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
}
