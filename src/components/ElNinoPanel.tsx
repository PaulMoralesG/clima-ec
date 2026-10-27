import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Async } from '../hooks';
import type { EnsoStatus } from '../lib/types';

const SEASON: Record<string, string> = {
  DJF: 'dic–feb',
  JFM: 'ene–mar',
  FMA: 'feb–abr',
  MAM: 'mar–may',
  AMJ: 'abr–jun',
  MJJ: 'may–jul',
  JJA: 'jun–ago',
  JAS: 'jul–sep',
  ASO: 'ago–oct',
  SON: 'sep–nov',
  OND: 'oct–dic',
  NDE: 'nov–ene',
};

function headline(s: EnsoStatus): string {
  if (s.phase === 'El Niño') return `El Niño ${s.strength ?? ''} activo`.replace('  ', ' ');
  if (s.phase === 'La Niña') return `La Niña ${s.strength ?? ''} activa`.replace('  ', ' ');
  return 'Condiciones neutrales';
}

export default function ElNinoPanel({ enso }: { enso: Async<EnsoStatus> }) {
  const s = enso.data;
  return (
    <section className="card" aria-label="Estado de El Niño">
      <h2>El Niño (ENSO)</h2>
      {enso.loading && <p className="muted">Consultando NOAA…</p>}
      {enso.error && <p className="error">{enso.error}</p>}
      {s && (
        <>
          <p
            className={`enso enso-${s.phase === 'El Niño' ? 'nino' : s.phase === 'La Niña' ? 'nina' : 'neutral'}`}
          >
            <strong>{headline(s)}</strong>
            <span>
              {' '}
              · índice ONI {s.oni > 0 ? '+' : ''}
              {s.oni.toFixed(1)} °C ({SEASON[s.season] ?? s.season} {s.year})
            </span>
          </p>
          <div className="chart" role="img" aria-label="Índice ONI de los últimos 12 trimestres">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={s.recent} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="rgba(128,140,160,0.25)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} domain={[-2.5, 2.5]} />
                <ReferenceLine y={0.5} stroke="#f08a24" strokeDasharray="4 3" />
                <ReferenceLine y={-0.5} stroke="#2f8be6" strokeDasharray="4 3" />
                <Tooltip formatter={(v) => [`${v} °C`, 'ONI']} />
                <Line dataKey="oni" stroke="#e5484d" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="muted small">
            Línea naranja: umbral de El Niño (+0,5). Línea azul: umbral de La Niña (−0,5).
          </p>
        </>
      )}
      <h3>¿Qué significa para Ecuador?</h3>
      <p>
        Durante El Niño el mar frente a la costa ecuatoriana se calienta y aumenta la evaporación, lo que
        puede traer lluvias más intensas y prolongadas en la Costa (Guayas, Manabí, Esmeraldas, El Oro, Santa
        Elena) y riesgo de inundaciones y deslizamientos. Cada evento es distinto: usa esta información junto
        con el pronóstico local.
      </p>
      <p className="muted small">
        El ONI mide el Pacífico central (Niño 3.4). Para la costa de Ecuador también importa la región Niño
        1+2, que el INAMHI y el ENFEN-IGP monitorean. Fuente: NOAA CPC.
      </p>
    </section>
  );
}
