import type { Risk } from '../lib/types';
import { longDate } from '../lib/format';

const ICON = { verde: '✅', amarillo: '⚠️', naranja: '🟠', rojo: '🚨' } as const;

export default function RiskBanner({ risk, date, today }: { risk: Risk; date: string; today: string }) {
  return (
    <section className={`risk risk-${risk.level}`} role="status" aria-live="polite">
      <div className="risk-icon" aria-hidden="true">
        {ICON[risk.level]}
      </div>
      <div>
        <h2>
          {risk.label}
          <span className="risk-when"> · {date === today ? 'hoy' : longDate(date)}</span>
        </h2>
        <p>{risk.advice}</p>
      </div>
    </section>
  );
}
