import { useState } from 'react';
import { notificationsSupported, requestNotifications } from '../lib/notify';
import { disablePush, enablePush, pushAvailable } from '../lib/push';
import type { Place } from '../lib/types';
import type { Settings } from '../lib/storage';

interface Props {
  place: Place;
  settings: Settings;
  onChange: (s: Settings) => void;
}

export default function SettingsCard({ place, settings, onChange }: Props) {
  const [denied, setDenied] = useState(false);
  const canNotify = notificationsSupported();
  const canPush = pushAvailable();
  const [pushError, setPushError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const togglePush = async (on: boolean) => {
    setBusy(true);
    setPushError(null);
    try {
      if (on) {
        await enablePush(place);
        onChange({ ...settings, push: true, pushPlace: place.name });
      } else {
        await disablePush();
        onChange({ ...settings, push: false, pushPlace: null });
      }
    } catch (e) {
      setPushError(
        (e as Error).message === 'permiso-denegado'
          ? 'Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.'
          : 'No se pudo activar. Intenta de nuevo más tarde.',
      );
    } finally {
      setBusy(false);
    }
  };

  const changePushPlace = async () => {
    setBusy(true);
    setPushError(null);
    try {
      await enablePush(place);
      onChange({ ...settings, pushPlace: place.name });
    } catch {
      setPushError('No se pudo cambiar la zona de los avisos.');
    } finally {
      setBusy(false);
    }
  };

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
      {canPush && (
        <>
          <label className="setting">
            <input
              type="checkbox"
              checked={settings.push}
              disabled={busy}
              onChange={(e) => void togglePush(e.target.checked)}
            />
            <span>
              <strong>Alertas con la app cerrada</strong>
              <span className="muted small">
                {' '}
                {settings.push
                  ? `Activas para ${settings.pushPlace ?? 'tu zona'} (riesgo alto o muy alto). Guardamos solo tu zona aproximada.`
                  : 'Te avisamos aunque no tengas la app abierta. Guardamos solo tu zona aproximada (~1 km).'}
              </span>
            </span>
          </label>
          {settings.push && settings.pushPlace !== place.name && (
            <button type="button" className="btn" disabled={busy} onClick={() => void changePushPlace()}>
              Usar {place.name} para las alertas
            </button>
          )}
          {pushError && <p className="error small">{pushError}</p>}
        </>
      )}
      {denied && (
        <p className="error small">
          Bloqueaste las notificaciones. Actívalas en los ajustes del navegador para este sitio.
        </p>
      )}
    </section>
  );
}
