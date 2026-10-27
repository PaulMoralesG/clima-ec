import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 deduce la URL del worker a partir de su propio módulo; al empaquetar con Vite hay que indicarla.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { Place } from '../lib/types';

interface Props {
  place: Place;
  onPick: (lat: number, lon: number) => void;
}

interface RainViewerFrame {
  time: number;
  path: string;
  forecast?: boolean;
}

const RADAR_MAX_ZOOM = 7;

maplibregl.setWorkerUrl(workerUrl);

async function loadRadarFrames(signal: AbortSignal): Promise<{ host: string; frames: RainViewerFrame[] }> {
  const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { signal });
  if (!res.ok) throw new Error('Radar no disponible');
  const data = (await res.json()) as {
    host: string;
    radar: { past: RainViewerFrame[]; nowcast: RainViewerFrame[] };
  };
  return {
    host: data.host,
    frames: [...data.radar.past, ...data.radar.nowcast.map((f) => ({ ...f, forecast: true }))],
  };
}

export default function MapView({ place, onPick }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const [frames, setFrames] = useState<RainViewerFrame[]>([]);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [radarError, setRadarError] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!container.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [place.longitude, place.latitude],
      zoom: 6,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.on('click', (e) => onPickRef.current(e.lngLat.lat, e.lngLat.lng));
    map.current = m;

    const ctrl = new AbortController();
    loadRadarFrames(ctrl.signal)
      .then(({ host, frames: fr }) => {
        const add = () => {
          fr.forEach((f, i) => {
            m.addSource(`radar-${i}`, {
              type: 'raster',
              tiles: [`${host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`],
              tileSize: 256,
              maxzoom: RADAR_MAX_ZOOM,
              attribution: 'Radar © <a href="https://www.rainviewer.com">RainViewer</a>',
            });
            m.addLayer({
              id: `radar-${i}`,
              type: 'raster',
              source: `radar-${i}`,
              paint: { 'raster-opacity': 0, 'raster-fade-duration': 0 },
            });
          });
          setFrames(fr);
          // Mostrar el último fotograma observado (el más reciente que no es previsión).
          const now = Date.now();
          setFrame(fr.reduce((idx, f, i) => (!f.forecast && f.time * 1000 <= now ? i : idx), 0));
        };
        if (m.isStyleLoaded()) add();
        else m.once('load', add);
      })
      .catch((e: Error) => e.name !== 'AbortError' && setRadarError(true));

    return () => {
      ctrl.abort();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- el mapa se crea una vez; los cambios de lugar se manejan abajo
  }, []);

  // Mover marcador y cámara cuando cambia el lugar.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    marker.current?.remove();
    marker.current = new maplibregl.Marker({ color: '#e5484d' })
      .setLngLat([place.longitude, place.latitude])
      .addTo(m);
    m.easeTo({ center: [place.longitude, place.latitude], zoom: Math.max(m.getZoom(), 7), duration: 600 });
  }, [place]);

  // Mostrar solo el fotograma activo.
  useEffect(() => {
    const m = map.current;
    if (!m || frames.length === 0) return;
    frames.forEach(
      (_, i) =>
        m.getLayer(`radar-${i}`) && m.setPaintProperty(`radar-${i}`, 'raster-opacity', i === frame ? 0.7 : 0),
    );
  }, [frame, frames]);

  // Animación.
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % frames.length), 700);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const current = frames[frame];
  const label = current
    ? new Date(current.time * 1000).toLocaleString('es-EC', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Guayaquil',
      })
    : '';
  const isForecast = current?.forecast === true;

  return (
    <section className="card map-card" aria-label="Mapa de lluvia en vivo">
      <h2>Mapa de lluvia en vivo</h2>
      <div ref={container} className="map" />
      <div className="map-controls">
        {frames.length > 0 ? (
          <>
            <button type="button" className="btn" onClick={() => setPlaying((p) => !p)}>
              {playing ? '⏸ Pausar' : '▶ Animar'}
            </button>
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={frame}
              onChange={(e) => {
                setPlaying(false);
                setFrame(Number(e.target.value));
              }}
              aria-label="Fotograma del radar"
            />
            <span className="small">
              {label}
              {isForecast ? ' (previsión)' : ''}
            </span>
          </>
        ) : (
          <span className="muted small">
            {radarError ? 'No se pudo cargar el radar. El mapa base sigue disponible.' : 'Cargando radar…'}
          </span>
        )}
      </div>
      <p className="muted small">
        Toca el mapa para consultar el pronóstico de ese punto. El radar tiene menos detalle en zonas
        montañosas y costa afuera.
      </p>
    </section>
  );
}
