import { useEffect, useRef, useState } from 'react';
import { fetchForecast } from './lib/openMeteo';
import { fetchEnso } from './lib/enso';
import type { EnsoStatus, Forecast, Place } from './lib/types';

export type Async<T> = { data: T | null; loading: boolean; error: string | null };

const REFRESH_MS = 15 * 60 * 1000;

export function useForecast(place: Place | null, lowData = false): Async<Forecast> & { reload: () => void } {
  // El resultado se guarda con el id del lugar al que pertenece, para no mostrar datos de otro lugar.
  const [result, setResult] = useState<{
    placeId: string;
    data: Forecast | null;
    error: string | null;
  } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!place) return;
    const ctrl = new AbortController();
    fetchForecast(place.latitude, place.longitude, ctrl.signal, lowData)
      .then((data) => setResult({ placeId: place.id, data, error: null }))
      .catch((e: Error) => {
        if (e.name === 'AbortError') return;
        const error = 'No se pudo cargar el pronóstico. Revisa tu conexión.';
        setResult((r) => ({ placeId: place.id, data: r?.placeId === place.id ? r.data : null, error }));
      });
    return () => ctrl.abort();
  }, [place, tick, lowData]);

  useEffect(() => {
    const refresh = () => document.visibilityState === 'visible' && setTick((t) => t + 1);
    const id = setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const current = place !== null && result?.placeId === place.id ? result : null;
  return {
    data: current?.data ?? null,
    loading: place !== null && current === null,
    error: current?.error ?? null,
    reload: () => setTick((t) => t + 1),
  };
}

export function useEnso(): Async<EnsoStatus> {
  const [state, setState] = useState<Async<EnsoStatus>>({ data: null, loading: true, error: null });
  useEffect(() => {
    const ctrl = new AbortController();
    fetchEnso(ctrl.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e: Error) => {
        if (e.name !== 'AbortError')
          setState({ data: null, loading: false, error: 'No se pudo consultar el estado de El Niño.' });
      });
    return () => ctrl.abort();
  }, []);
  return state;
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** Carga datos asociados a una clave; el resultado se etiqueta con la clave para no mostrar datos de otro lugar. */
export function useKeyed<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>): Async<T> {
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null } | null>(null);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (key === null) return;
    const ctrl = new AbortController();
    fetcherRef
      .current(ctrl.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch(
        (e: Error) =>
          e.name !== 'AbortError' && setResult({ key, data: null, error: 'No se pudo cargar este dato.' }),
      );
    return () => ctrl.abort();
  }, [key]);

  const current = key !== null && result?.key === key ? result : null;
  return {
    data: current?.data ?? null,
    loading: key !== null && current === null,
    error: current?.error ?? null,
  };
}
