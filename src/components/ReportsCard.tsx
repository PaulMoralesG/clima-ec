import { useState } from 'react';
import { useKeyed } from '../hooks';
import { fetchReports, hoursAgo, KIND_LABEL, sendReport, type ReportKind } from '../lib/reports';
import type { Place } from '../lib/types';

export default function ReportsCard({ place }: { place: Place }) {
  const { data, loading, error } = useKeyed(place.id, (s) =>
    fetchReports(place.latitude, place.longitude, s),
  );
  const [kind, setKind] = useState<ReportKind>('inundacion');
  const [note, setNote] = useState('');
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; message?: string }>({
    status: 'idle',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending' });
    try {
      await sendReport({
        kind,
        note,
        latitude: place.latitude,
        longitude: place.longitude,
        placeName: place.name,
      });
      setNote('');
      setState({ status: 'done' });
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message });
    }
  };

  return (
    <section className="card" aria-label="Reportes de la comunidad">
      <h2>Reportes de la comunidad</h2>
      {loading && <p className="muted">Consultando…</p>}
      {error && <p className="muted">Los reportes no están disponibles por ahora.</p>}
      {data && data.length === 0 && (
        <p className="muted">No hay reportes verificados cerca de {place.name} en las últimas 48 horas.</p>
      )}
      {data && data.length > 0 && (
        <ul className="reports">
          {data.map((r) => (
            <li key={r.id}>
              <strong>{KIND_LABEL[r.kind]}</strong>
              <span className="muted small">
                {' '}
                · {r.place_name ?? 'Cerca de ti'} · {hoursAgo(r.created_at)}
              </span>
              {r.note && <p>{r.note}</p>}
            </li>
          ))}
        </ul>
      )}

      <h3>Reportar algo en {place.name}</h3>
      <form onSubmit={(e) => void submit(e)} className="report-form">
        <label>
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value as ReportKind)}>
            {Object.entries(KIND_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Detalle (opcional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Calle, referencia, qué pasa…"
          />
        </label>
        <button type="submit" className="btn" disabled={state.status === 'sending'}>
          {state.status === 'sending' ? 'Enviando…' : 'Enviar reporte'}
        </button>
        {state.status === 'done' && (
          <p role="status">Gracias. Tu reporte será revisado antes de publicarse.</p>
        )}
        {state.status === 'error' && (
          <p className="error" role="alert">
            {state.message}
          </p>
        )}
      </form>
      <p className="muted small">
        Los reportes no son alertas oficiales ni sustituyen al ECU 911. No incluyas datos personales. Se
        publican solo después de una revisión.
      </p>
    </section>
  );
}
