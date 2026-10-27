import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyPoint, HourlyPoint } from '../lib/types';
import { hourLabel, longDate, shortDate } from '../lib/format';
import { sum } from '../lib/risk';

const RAIN = '#2f8be6';
const RAIN_PAST = '#7a8ca3';
const TEMP = '#f08a24';
const GRID = 'rgba(128,140,160,0.25)';

export function HourlyChart({ hourly, date }: { hourly: HourlyPoint[]; date: string }) {
  const data = hourly
    .filter((h) => h.time.startsWith(date))
    .map((h) => ({
      hora: hourLabel(h.time),
      lluvia: h.precipitation,
      prob: h.probability,
      temp: h.temperature,
    }));
  const total = sum(data.map((d) => d.lluvia));
  return (
    <section className="card" aria-label="Detalle hora a hora">
      <h2>{longDate(date)}</h2>
      <p className="muted">
        Lluvia total del día: <strong>{total.toFixed(1)} mm</strong>
      </p>
      <div
        className="chart"
        role="img"
        aria-label={`Gráfico por hora: lluvia total ${total.toFixed(1)} milímetros`}
      >
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="hora" interval={3} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="mm" tick={{ fontSize: 11 }} unit=" mm" />
            <YAxis
              yAxisId="t"
              orientation="right"
              tick={{ fontSize: 11 }}
              unit="°"
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              formatter={(v, n) =>
                n === 'Temperatura' ? [`${v}°C`, n] : n === 'Probabilidad' ? [`${v}%`, n] : [`${v} mm`, n]
              }
            />
            <Bar yAxisId="mm" dataKey="lluvia" name="Lluvia" fill={RAIN} radius={[3, 3, 0, 0]} />
            <Line yAxisId="t" dataKey="temp" name="Temperatura" stroke={TEMP} dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function RainTrendChart({ daily, today }: { daily: DailyPoint[]; today: string }) {
  const data = daily.map((d) => ({
    fecha: shortDate(d.date),
    lluvia: d.precipitationSum,
    past: d.isPast,
    date: d.date,
  }));
  const past = sum(daily.filter((d) => d.isPast).map((d) => d.precipitationSum));
  const next7 = sum(
    daily
      .filter((d) => !d.isPast)
      .slice(0, 7)
      .map((d) => d.precipitationSum),
  );
  const todayLabel = data.find((d) => d.date === today)?.fecha;
  return (
    <section className="card" aria-label="Lluvia acumulada">
      <h2>Lluvia: últimos 7 días y próximos 16</h2>
      <p className="muted">
        Acumulado 7 días atrás: <strong>{past.toFixed(1)} mm</strong> · Próximos 7 días:{' '}
        <strong>{next7.toFixed(1)} mm</strong>
      </p>
      <div
        className="chart"
        role="img"
        aria-label={`Lluvia diaria. Últimos 7 días ${past} mm, próximos 7 días ${next7} mm`}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="fecha" interval={2} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" mm" />
            <Tooltip formatter={(v) => [`${v} mm`, 'Lluvia']} />
            {todayLabel && (
              <ReferenceLine
                x={todayLabel}
                stroke={TEMP}
                strokeDasharray="4 3"
                label={{ value: 'Hoy', fontSize: 11, fill: TEMP }}
              />
            )}
            <Bar dataKey="lluvia" radius={[3, 3, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.date} fill={d.past ? RAIN_PAST : RAIN} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="legend small muted">
        <span className="swatch" style={{ background: RAIN_PAST }} /> Registrado/modelado{' '}
        <span className="swatch" style={{ background: RAIN }} /> Pronóstico
      </p>
    </section>
  );
}
