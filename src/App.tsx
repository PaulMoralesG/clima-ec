import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import SearchBox from './components/SearchBox';
import RiskBanner from './components/RiskBanner';
import CurrentCard from './components/CurrentCard';
import DailyList from './components/DailyList';
import SafetyPanel from './components/SafetyPanel';
import { useEnso, useForecast } from './hooks';
import { DEFAULT_PLACE, detectPlace, isInEcuador, reverseGeocode } from './lib/geocode';
import { worstRisk } from './lib/risk';
import { loadLastPlace, loadSavedPlaces, saveLastPlace, saveSavedPlaces } from './lib/storage';
import type { Place } from './lib/types';

const ElNinoPanel = lazy(() => import('./components/ElNinoPanel'));
const MapView = lazy(() => import('./components/MapView'));
const Charts = lazy(() => import('./components/Charts').then((m) => ({ default: m.HourlyChart })));
const RainTrend = lazy(() => import('./components/Charts').then((m) => ({ default: m.RainTrendChart })));

type Tab = 'resumen' | 'mapa' | 'nino' | 'seguridad';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'resumen', label: 'Resumen', icon: '🌦️' },
  { id: 'mapa', label: 'Mapa', icon: '🗺️' },
  { id: 'nino', label: 'El Niño', icon: '🌊' },
  { id: 'seguridad', label: 'Seguridad', icon: '🛟' },
];

export default function App() {
  const [place, setPlace] = useState<Place | null>(() => loadLastPlace());
  const [detected, setDetected] = useState(false);
  const [saved, setSaved] = useState<Place[]>(loadSavedPlaces);
  const [tab, setTab] = useState<Tab>('resumen');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const forecast = useForecast(place);
  const enso = useEnso();

  const [locating, setLocating] = useState(() => place === null);

  const detect = useCallback(async () => {
    try {
      const r = await detectPlace();
      setPlace(r.place);
      setDetected(r.detected);
      if (!r.detected) {
        setNotice(
          `No pudimos detectar tu ubicación en Ecuador. Mostrando ${DEFAULT_PLACE.name}; busca tu ciudad arriba.`,
        );
      }
    } catch {
      setPlace(DEFAULT_PLACE);
    } finally {
      setLocating(false);
    }
  }, []);

  const locate = useCallback(() => {
    setLocating(true);
    setNotice(null);
    void detect();
  }, [detect]);

  // Al abrir: si no hay un lugar recordado, detectar automáticamente.
  useEffect(() => {
    // La detección es asíncrona: los setState ocurren tras esperar al navegador, no durante el efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (place === null) void detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo en el primer render
  }, []);

  useEffect(() => {
    if (place) saveLastPlace(place);
  }, [place]);

  const choose = (p: Place) => {
    setPlace(p);
    setDetected(false);
    setSelectedDate(null);
    setNotice(null);
  };

  const pickPoint = useCallback(async (lat: number, lon: number) => {
    if (!isInEcuador(lat, lon)) {
      setNotice('Ese punto está fuera de Ecuador. ClimaEC solo cubre Ecuador.');
      return;
    }
    const p = await reverseGeocode(lat, lon);
    setPlace(p);
    setDetected(false);
    setSelectedDate(null);
    setNotice(null);
  }, []);

  const isSaved = place ? saved.some((s) => s.id === place.id) : false;
  const toggleSave = () => {
    if (!place) return;
    const next = isSaved ? saved.filter((s) => s.id !== place.id) : [...saved, place];
    setSaved(next);
    saveSavedPlaces(next);
  };

  const f = forecast.data;
  const today = f?.current.time.slice(0, 10) ?? '';
  const selected = selectedDate ?? today;
  const worst = useMemo(() => (f ? worstRisk(f.daily, f.hourly, today, 3) : null), [f, today]);

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">🌧️ ClimaEC</span>
        <SearchBox onSelect={choose} onLocate={locate} locating={locating} />
      </header>

      {saved.length > 0 && (
        <nav className="chips" aria-label="Lugares guardados">
          {saved.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip${place?.id === s.id ? ' is-active' : ''}`}
              onClick={() => choose(s)}
            >
              ★ {s.name}
            </button>
          ))}
        </nav>
      )}

      <main>
        {notice && (
          <p className="notice" role="alert">
            {notice}
          </p>
        )}
        {forecast.error && (
          <p className="error" role="alert">
            {forecast.error}{' '}
            <button type="button" className="link" onClick={forecast.reload}>
              Reintentar
            </button>
          </p>
        )}
        {!place || (forecast.loading && !f) ? (
          <p className="muted loading">Detectando tu ubicación y cargando el pronóstico…</p>
        ) : null}

        {place && f && worst && (
          <>
            {tab === 'resumen' && (
              <>
                <RiskBanner risk={worst.risk} date={worst.date} today={today} />
                <CurrentCard
                  place={place}
                  current={f.current}
                  saved={isSaved}
                  detected={detected}
                  onToggleSave={toggleSave}
                />
                <DailyList
                  daily={f.daily}
                  hourly={f.hourly}
                  today={today}
                  selected={selected}
                  onSelect={setSelectedDate}
                />
                <Suspense fallback={<p className="muted">Cargando gráficos…</p>}>
                  <Charts hourly={f.hourly} date={selected} />
                  <RainTrend daily={f.daily} today={today} />
                </Suspense>
              </>
            )}
            {tab === 'mapa' && (
              <Suspense fallback={<p className="muted">Cargando mapa…</p>}>
                <MapView place={place} onPick={pickPoint} />
              </Suspense>
            )}
            {tab === 'nino' && (
              <Suspense fallback={<p className="muted">Cargando…</p>}>
                <ElNinoPanel enso={enso} />
              </Suspense>
            )}
            {tab === 'seguridad' && <SafetyPanel />}
          </>
        )}
        {place && !f && tab === 'nino' && (
          <Suspense fallback={null}>
            <ElNinoPanel enso={enso} />
          </Suspense>
        )}
        {tab === 'seguridad' && !f && <SafetyPanel />}

        <footer className="disclaimer small muted">
          ClimaEC es una herramienta informativa, <strong>no oficial</strong>. Datos: Open-Meteo, RainViewer,
          NOAA y OpenStreetMap. Ante una emergencia sigue siempre las alertas del INAMHI, la SNGRE y el ECU
          911.
          {f && (
            <>
              {' '}
              Actualizado:{' '}
              {new Date(f.fetchedAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
            </>
          )}
        </footer>
      </main>

      <nav className="tabbar" aria-label="Secciones">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'is-active' : ''}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
