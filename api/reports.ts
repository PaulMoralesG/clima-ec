import { createHash } from 'node:crypto';
import { allow, clientIp, queryParam, send, type Req, type Res } from './_lib/http';
import { rest, supabaseConfig } from './_lib/supabase';
import { validateReport } from './_lib/validate';

const MAX_PER_HOUR = 5;
const WINDOW_HOURS = 48;
const BOX_DEG = 0.3; // ~33 km alrededor del punto consultado

interface ReportRow {
  id: string;
  kind: string;
  note: string | null;
  latitude: number;
  longitude: number;
  place_name: string | null;
  created_at: string;
}

/**
 * GET: reportes ya aprobados cerca de un punto (últimas 48 h).
 * POST: crea un reporte como "pendiente"; nadie lo ve hasta que se apruebe en Supabase.
 */
export default async function handler(req: Req, res: Res): Promise<void> {
  const cfg = supabaseConfig();
  if (!cfg) return send(res, 503, { error: 'Servicio no configurado' });

  try {
    if (req.method === 'GET') {
      const lat = Number(queryParam(req, 'lat'));
      const lon = Number(queryParam(req, 'lon'));
      if (!Number.isFinite(lat) || !Number.isFinite(lon))
        return send(res, 400, { error: 'Coordenadas inválidas' });
      const since = new Date(Date.now() - WINDOW_HOURS * 3_600_000).toISOString();
      const rows = await rest<ReportRow[]>(
        cfg,
        'reports?select=id,kind,note,latitude,longitude,place_name,created_at' +
          `&status=eq.publicado&created_at=gte.${encodeURIComponent(since)}` +
          `&latitude=gte.${lat - BOX_DEG}&latitude=lte.${lat + BOX_DEG}` +
          `&longitude=gte.${lon - BOX_DEG}&longitude=lte.${lon + BOX_DEG}` +
          '&order=created_at.desc&limit=30',
      );
      return send(res, 200, rows, { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' });
    }

    if (!allow(req, res, 'POST')) return;
    const parsed = validateReport(req.body);
    if (!parsed.ok) return send(res, 400, { error: parsed.error });

    const salt = process.env.REPORT_SALT ?? 'clima-ec';
    const ipHash = createHash('sha256')
      .update(`${salt}|${clientIp(req)}`)
      .digest('hex')
      .slice(0, 32);
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const recent = await rest<{ id: string }[]>(
      cfg,
      `reports?select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(hourAgo)}&limit=${MAX_PER_HOUR}`,
    );
    if (recent.length >= MAX_PER_HOUR)
      return send(res, 429, { error: 'Demasiados reportes. Intenta más tarde.' });

    const v = parsed.value;
    await rest(cfg, 'reports', {
      method: 'POST',
      prefer: 'return=minimal',
      body: {
        kind: v.kind,
        note: v.note,
        latitude: v.latitude,
        longitude: v.longitude,
        place_name: v.placeName,
        ip_hash: ipHash,
      },
    });
    send(res, 201, { ok: true, status: 'pendiente' });
  } catch {
    send(res, 502, { error: 'Servicio de reportes no disponible' });
  }
}
