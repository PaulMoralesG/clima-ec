import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useKeyed } from '../hooks';
import { assessFlood, fetchFlood } from '../lib/flood';
import { fetchMarine, maxOf, waveLevel } from '../lib/marine';
import { fetchQuakes } from '../lib/quakes';
import { shortDate } from '../lib/format';
import type { Place, RiskLevel } from '../lib/types';

const LABEL: Record<RiskLevel, string> = {
  verde: 'Normal',
  amarillo: 'Precaución',
  naranja: 'Alto',
  rojo: 'Muy alto',
};
const GRID = 'rgba(128,140,160,0.25)';

const Badge = ({ level }: { level: RiskLevel }) => (
  <span className={`badge badge-${level}`}>{LABEL[level]}</span>
);

function FloodCard({ place, today }: { place: Place; today: string }) {
  const { data, loading, error } = useKeyed(`${place.id}|${today}`, (s) =>
    fetchFlood(place.latitude, place.longitude, today, s),
  );
  const a = data ? assessFlood(data) : null;
  const chart =
    data?.map((p) => ({ fecha: shortDate(p.date), caudal: Math.round(p.discharge * 10) / 10 })) ?? [];
  return (
    <section className="card" aria-label="Caudal de ríos">
      <h2>Ríos e inundación {a && <Badge level={a.level} />}</h2>
      {loading && <p className="muted">Consultando caudal…</p>}
      {error && <p className="error">{error}</p>}
      {data && data.length === 0 && <p className="muted">No hay datos de ríos cerca de este punto.</p>}
      {a && data && data.length > 0 && (
        <>
          <p>
            {a.peak && a.ratio >= 1.4 ? (
              <>
                Se espera una crecida: el caudal llegaría a{' '}
                <strong>{a.peak.discharge.toFixed(0)} m³/s</strong> el {shortDate(a.peak.date)}, unas{' '}
                <strong>{a.ratio.toFixed(1)}×</strong> el promedio de la última semana.
              </>
            ) : (
              'No se prevén crecidas bruscas en el río más cercano durante los próximos días.'
            )}
          </p>
          <div className="chart" role="img" aria-label="Caudal diario del río más cercano">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chart} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="fecha" interval={3} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" m³/s" width={64} />
                <Tooltip formatter={(v) => [`${v} m³/s`, 'Caudal']} />
                <Area dataKey="caudal" stroke="#2f8be6" fill="#2f8be6" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="muted small">
            Modelo global (GloFAS) con resolución de ~5 km: es una referencia relativa, no una cota de
            desborde. Para ríos específicos consulta el INAMHI.
          </p>
        </>
      )}
    </section>
  );
}

function MarineCard({ place }: { place: Place }) {
  const { data, loading, error } = useKeyed(place.id, (s) => fetchMarine(place.latitude, place.longitude, s));
  if (loading)
    return (
      <section className="card">
        <h2>Mar y oleaje</h2>
        <p className="muted">Consultando…</p>
      </section>
    );
  if (error)
    return (
      <section className="card">
        <h2>Mar y oleaje</h2>
        <p className="error">{error}</p>
      </section>
    );
  if (!data || data.length === 0) {
    return (
      <section className="card" aria-label="Mar y oleaje">
        <h2>Mar y oleaje</h2>
        <p className="muted">
          Este punto no está en la costa. Busca un puerto (Salinas, Manta, Esmeraldas) para ver el oleaje.
        </p>
      </section>
    );
  }
  const maxWave = maxOf(data.map((p) => p.waveHeight));
  const level = waveLevel(maxWave);
  const chart = data.map((p) => ({
    hora: `${shortDate(p.time.slice(0, 10))} ${p.time.slice(11, 13)}h`,
    oleaje: p.waveHeight,
    marea: p.seaLevel,
  }));
  return (
    <section className="card" aria-label="Mar y oleaje">
      <h2>
        Mar y oleaje <Badge level={level} />
      </h2>
      <p>
        Oleaje máximo en 5 días: <strong>{maxWave.toFixed(1)} m</strong>.
      </p>
      <div
        className="chart"
        role="img"
        aria-label={`Altura de olas y nivel del mar, máximo ${maxWave.toFixed(1)} metros`}
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chart} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="hora" interval={23} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" m" />
            <Tooltip formatter={(v, n) => [`${Number(v).toFixed(2)} m`, n]} />
            <Line dataKey="oleaje" name="Altura de olas" stroke="#2f8be6" dot={false} strokeWidth={2} />
            <Line dataKey="marea" name="Nivel del mar" stroke="#f08a24" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="muted small">
        El nivel del mar es relativo al promedio e incluye la marea astronómica. No es una alerta de tsunami.
      </p>
    </section>
  );
}

function QuakesCard({ place }: { place: Place }) {
  const { data, loading, error } = useKeyed(place.id, (s) => fetchQuakes(place.latitude, place.longitude, s));
  return (
    <section className="card" aria-label="Sismos recientes">
      <h2>Sismos recientes</h2>
      {loading && <p className="muted">Consultando USGS…</p>}
      {error && <p className="error">{error}</p>}
      {data && data.length === 0 && (
        <p className="muted">Sin sismos de magnitud 3,5 o mayor en 400 km durante los últimos 7 días.</p>
      )}
      {data && data.length > 0 && (
        <ul className="quakes">
          {data.map((q) => (
            <li key={q.id}>
              <span
                className={`mag mag-${q.magnitude >= 5.5 ? 'rojo' : q.magnitude >= 4.5 ? 'naranja' : 'amarillo'}`}
              >
                {q.magnitude.toFixed(1)}
              </span>
              <div>
                <a href={q.url} target="_blank" rel="noopener noreferrer">
                  {q.place}
                </a>
                <div className="muted small">
                  {new Date(q.time).toLocaleString('es-EC', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Guayaquil',
                  })}
                  {' · '}a {q.distanceKm} km · {q.depthKm.toFixed(0)} km de profundidad
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">
        Fuente: USGS. Para información oficial sobre sismos y volcanes consulta el IGEPN (igepn.edu.ec).
      </p>
    </section>
  );
}

export default function RisksPanel({ place, today }: { place: Place; today: string }) {
  return (
    <>
      <FloodCard place={place} today={today} />
      <MarineCard place={place} />
      <QuakesCard place={place} />
    </>
  );
}
