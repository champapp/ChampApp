import { useState } from 'react';
import { CC, Icon, Card, TextInput } from '../../ui';
import { percentOfWeight, roundToStep } from '../../lib/domain';

const QUICK_PCTS = [50, 60, 65, 70, 75, 80, 85, 90, 95, 100];

// admite coma o punto decimal; '' / texto inválido → NaN
const num = (s) => parseFloat(String(s).replace(',', '.'));
const fmt = (n) => String(Math.round(n * 100) / 100);

// Calculadora de % de las rutinas: se ingresa el peso base (ej. el 1RM o la
// marca de referencia) y el % que pide la rutina, y devuelve los kg a cargar.
// `marks` (opcional): marcas en kg del jugador, para usarlas de base con un toque.
export function PercentCalculator({ marks = [] }) {
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState('');
  const [pct, setPct] = useState('80');

  const baseN = num(base);
  const pctN = num(pct);
  const valid = baseN > 0 && pctN > 0;
  const result = valid ? percentOfWeight(baseN, pctN) : null;
  const rounded = valid ? roundToStep(result) : null;

  const kgMarks = marks.filter((m) => m.unit === 'kg');
  const label = { fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: CC.muted, textTransform: 'uppercase', marginBottom: 6 };

  return (
    <Card pad={0} style={{ overflow: 'hidden', marginBottom: 16 }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(249,178,51,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="target" size={20} color={CC.goldDeep} sw={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 18, color: CC.ink, letterSpacing: 0.3, lineHeight: 1.05 }}>Calculadora de %</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: CC.muted, marginTop: 2 }}>Calculá los kg de cada % de la rutina</div>
        </div>
        <Icon name={open ? 'chevUp' : 'chevron'} size={18} color={CC.faint} sw={2.3} />
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1.2 }}>
              <div style={label}>Peso base (kg)</div>
              <TextInput type="text" inputMode="decimal" value={base} onChange={(e) => setBase(e.target.value)} placeholder="Ej: 120" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={label}>Porcentaje (%)</div>
              <TextInput type="text" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="Ej: 80" />
            </div>
          </div>

          {kgMarks.length > 0 && (
            <div>
              <div style={label}>Usar una de mis marcas</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {kgMarks.map((m) => (
                  <button key={m.exercise} onClick={() => setBase(String(m.value))} style={{ border: `1.5px solid ${num(base) === Number(m.value) ? CC.navy : CC.line}`, background: num(base) === Number(m.value) ? CC.navy : '#fff', color: num(base) === Number(m.value) ? '#fff' : CC.navy, borderRadius: 999, padding: '6px 11px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13.5 }}>
                    {m.exercise} · {m.value} kg
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_PCTS.map((p) => (
              <button key={p} onClick={() => setPct(String(p))} style={{ border: `1.5px solid ${pctN === p ? CC.gold : CC.line}`, background: pctN === p ? CC.gold : '#fff', color: pctN === p ? CC.navy900 : CC.navy, borderRadius: 9, padding: '6px 10px', cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>
                {p}%
              </button>
            ))}
          </div>

          <div style={{ background: `linear-gradient(155deg, ${CC.navy} 0%, ${CC.navy900} 100%)`, borderRadius: 14, padding: '14px 16px', color: '#fff' }}>
            {valid ? (
              <>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{fmt(pctN)}% de {fmt(baseN)} kg</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 46, lineHeight: 1, color: CC.gold }}>{fmt(result)}</span>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 20, color: 'rgba(255,255,255,0.8)' }}>kg</span>
                </div>
                {rounded !== result && (
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
                    Redondeado a discos de 2,5 kg: <b style={{ color: '#fff' }}>{fmt(rounded)} kg</b>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13.5, color: 'rgba(255,255,255,0.7)' }}>Ingresá el peso base y el porcentaje para ver los kg.</div>
            )}
          </div>

          {baseN > 0 && (
            <div>
              <div style={label}>Tabla rápida · {fmt(baseN)} kg</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {QUICK_PCTS.map((p) => (
                  <button key={p} onClick={() => setPct(String(p))} style={{ border: 'none', background: pctN === p ? 'rgba(249,178,51,0.22)' : CC.paper, borderRadius: 9, padding: '7px 2px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, fontWeight: 700, color: CC.muted }}>{p}%</div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: CC.ink, lineHeight: 1.1 }}>{fmt(percentOfWeight(baseN, p))}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
