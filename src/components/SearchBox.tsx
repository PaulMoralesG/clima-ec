import { useEffect, useId, useState } from 'react';
import { searchPlaces } from '../lib/geocode';
import type { Place } from '../lib/types';
import { useDebounced } from '../hooks';

interface Props {
  onSelect: (p: Place) => void;
  onLocate: () => void;
  locating: boolean;
}

export default function SearchBox({ onSelect, onLocate, locating }: Props) {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query);
  const listId = useId();
  // Resultado asociado a la consulta que lo originó; si no coincide con `debounced`, aún está buscando.
  const [found, setFound] = useState<{ q: string; results: Place[]; error: boolean } | null>(null);

  const active = debounced.trim().length >= 2;
  const settled = active && found?.q === debounced ? found : null;
  const loading = active && settled === null;

  useEffect(() => {
    if (debounced.trim().length < 2) return;
    const ctrl = new AbortController();
    searchPlaces(debounced, ctrl.signal)
      .then((results) => setFound({ q: debounced, results, error: false }))
      .catch((e: Error) => e.name !== 'AbortError' && setFound({ q: debounced, results: [], error: true }));
    return () => ctrl.abort();
  }, [debounced]);

  const pick = (p: Place) => {
    onSelect(p);
    setQuery('');
  };

  return (
    <div className="search">
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ciudad o cantón (ej. Manta)"
          aria-label="Buscar lugar en Ecuador"
          aria-controls={listId}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn"
          onClick={onLocate}
          disabled={locating}
          aria-label="Usar mi ubicación"
        >
          {locating ? '…' : '📍'}
        </button>
      </div>
      {active && query && (
        <ul id={listId} className="search-results" role="listbox">
          {loading && <li className="muted">Buscando…</li>}
          {settled?.error && <li className="muted">No se pudo buscar. Intenta de nuevo.</li>}
          {settled && !settled.error && settled.results.length === 0 && (
            <li className="muted">Sin resultados en Ecuador.</li>
          )}
          {settled?.results.map((p) => (
            <li key={p.id} role="option" aria-selected={false}>
              <button type="button" onClick={() => pick(p)}>
                <strong>{p.name}</strong>
                {p.admin && <span className="muted"> · {p.admin}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
