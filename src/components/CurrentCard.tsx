import type { CurrentWeather, Place } from '../lib/types';
import { describeWeather } from '../lib/weatherCodes';

interface Props {
  place: Place;
  current: CurrentWeather;
  saved: boolean;
  detected: boolean;
  onToggleSave: () => void;
}

export default function CurrentCard({ place, current, saved, detected, onToggleSave }: Props) {
  const w = describeWeather(current.weatherCode);
  return (
    <section className="card current">
      <div className="current-head">
        <div>
          <h1>{place.name}</h1>
          <p className="muted">
            {[place.admin, 'Ecuador'].filter(Boolean).join(', ')}
            {detected && ' · ubicación detectada'}
          </p>
          {place.address && <p className="muted small">{place.address}</p>}
        </div>
        <button
          type="button"
          className="btn"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? 'Quitar de guardados' : 'Guardar lugar'}
        >
          {saved ? '★' : '☆'}
        </button>
      </div>
      <div className="current-main">
        <span className="current-emoji" aria-hidden="true">
          {w.emoji}
        </span>
        <span className="current-temp">{Math.round(current.temperature)}°</span>
        <span className="current-desc">{w.text}</span>
      </div>
      <dl className="stats">
        <div>
          <dt>Sensación</dt>
          <dd>{Math.round(current.apparent)}°</dd>
        </div>
        <div>
          <dt>Humedad</dt>
          <dd>{current.humidity}%</dd>
        </div>
        <div>
          <dt>Viento</dt>
          <dd>{Math.round(current.windSpeed)} km/h</dd>
        </div>
        <div>
          <dt>Lluvia ahora</dt>
          <dd>{current.precipitation.toFixed(1)} mm</dd>
        </div>
      </dl>
    </section>
  );
}
