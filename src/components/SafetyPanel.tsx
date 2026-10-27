import { useState } from 'react';

const KEY = 'clima-ec:kit';
const ITEMS = [
  'Agua potable (3 litros por persona por día)',
  'Alimentos no perecibles para 3 días',
  'Linterna y pilas de repuesto',
  'Radio a pilas o batería externa para el celular',
  'Botiquín y medicinas de uso diario',
  'Documentos importantes en bolsa impermeable',
  'Copia de contactos de emergencia en papel',
  'Ropa de abrigo y calzado cerrado',
  'Silbato, mascarillas y artículos de higiene',
  'Plan familiar: punto de encuentro y ruta de evacuación',
];

function load(): boolean[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as boolean[];
    return ITEMS.map((_, i) => raw[i] === true);
  } catch {
    return ITEMS.map(() => false);
  }
}

export default function SafetyPanel() {
  const [done, setDone] = useState<boolean[]>(load);

  const toggle = (i: number) => {
    const next = done.map((v, j) => (j === i ? !v : v));
    setDone(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* sin almacenamiento: el checklist funciona solo en esta sesión */
    }
  };

  return (
    <>
      <section className="card" aria-label="Emergencias">
        <h2>Emergencias</h2>
        <a className="btn btn-danger btn-block" href="tel:911">
          📞 Llamar al ECU 911
        </a>
        <ul className="links">
          <li>
            <a href="https://www.inamhi.gob.ec" target="_blank" rel="noopener noreferrer">
              INAMHI: pronóstico y alertas oficiales
            </a>
          </li>
          <li>
            <a href="https://www.gestionderiesgos.gob.ec" target="_blank" rel="noopener noreferrer">
              Servicio Nacional de Gestión de Riesgos y Emergencias
            </a>
          </li>
        </ul>
      </section>
      <section className="card" aria-label="Mochila de emergencia">
        <h2>Mochila de emergencia</h2>
        <p className="muted small">
          {done.filter(Boolean).length} de {ITEMS.length} listos
        </p>
        <ul className="checklist">
          {ITEMS.map((item, i) => (
            <li key={item}>
              <label>
                <input type="checkbox" checked={done[i]} onChange={() => toggle(i)} /> {item}
              </label>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
