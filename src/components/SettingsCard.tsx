import { useState } from 'react';
import { notificationsSupported, requestNotifications } from '../lib/notify';
import type { Settings } from '../lib/storage';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

export default function SettingsCard({ settings, onChange }: Props) {
  const [denied, setDenied] = useState(false);
  const canNotify = notificationsSupported();

  const toggleNotify = async (on: boolean) => {
    if (!on) return onChange({ ...settings, notify: false });
    const ok = await requestNotifications();
    setDenied(!ok);
    onChange({ ...settings, notify: ok });
  };

  return (
    <section className="card" aria-label="Ajustes">
      <h2>Ajustes</h2>
      <label className="setting">
        <input
          type="checkbox"
          checked={settings.lowData}
          onChange={(e) => onChange({ ...settings, lowData: e.target.checked })}
        />
        <span>
          <strong>Modo ahorro de datos</strong>
          <span className="muted small"> Pronóstico más corto y el mapa solo se carga cuando lo pides.</span>
        </span>
      </label>
      <label className="setting">
        <input
          type="checkbox"
          checked={settings.notify}
          disabled={!canNotify}
          onChange={(e) => void toggleNotify(e.target.checked)}
        />
        <span>
          <strong>Avisos de lluvia fuerte</strong>
          <span className="muted small">
            {' '}
            {canNotify
              ? 'Una notificación cuando el riesgo sea alto o muy alto. Funciona al abrir la app; instálala para mejores resultados.'
              : 'Tu navegador no admite notificaciones.'}
          </span>
        </span>
      </label>
      {denied && (
        <p className="error small">
          Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.
        </p>
      )}
    </section>
  );
}
