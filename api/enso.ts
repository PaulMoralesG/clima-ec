import type { IncomingMessage, ServerResponse } from 'node:http';
import { parseOni } from '../src/lib/enso';

const SOURCE = 'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt';

/**
 * Función serverless (Vercel): NOAA CPC no envía cabeceras CORS, así que el
 * navegador no puede leerlo directamente. Aquí se descarga, se parsea y se cachea 12 h.
 */
export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const upstream = await fetch(SOURCE, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`NOAA respondió ${upstream.status}`);
    const status = parseOni(await upstream.text());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    res.end(JSON.stringify(status));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: (e as Error).message }));
  }
}
