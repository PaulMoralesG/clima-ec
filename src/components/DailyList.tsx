import type { DailyPoint, HourlyPoint } from '../lib/types';
import { riskForDay } from '../lib/risk';
import { dayLabel, shortDate } from '../lib/format';
import { describeWeather } from '../lib/weatherCodes';

interface Props {
  daily: DailyPoint[];
  hourly: HourlyPoint[];
  today: string;
  selected: string;
  onSelect: (date: string) => void;
}

export default function DailyList({ daily, hourly, today, selected, onSelect }: Props) {
  return (
    <section className="card" aria-label="Pronóstico por día">
      <h2>Próximos días</h2>
      <ul className="days">
        {daily
          .filter((d) => !d.isPast)
          .map((d) => {
            const risk = riskForDay(d, hourly);
            return (
              <li key={d.date}>
                <button
                  type="button"
                  className={`day${d.date === selected ? ' is-selected' : ''}${d.isPast ? ' is-past' : ''}`}
                  onClick={() => onSelect(d.date)}
                  aria-pressed={d.date === selected}
                >
                  <span className="day-name">{dayLabel(d.date, today)}</span>
                  <span className="day-date muted">{shortDate(d.date)}</span>
                  <span aria-hidden="true">{describeWeather(d.weatherCode).emoji}</span>
                  <span className="day-rain">{d.precipitationSum.toFixed(1)} mm</span>
                  <span className="day-temp">
                    {Math.round(d.tempMin)}° / {Math.round(d.tempMax)}°
                  </span>
                  <span className={`dot dot-${risk.level}`} title={risk.label} aria-label={risk.label} />
                </button>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
