import type { IncomingMessage, ServerResponse } from 'node:http';

export type Req = IncomingMessage & { body?: unknown; query?: Record<string, string | string[] | undefined> };
export type Res = ServerResponse;

export function send(res: Res, status: number, body: unknown, headers: Record<string, string> = {}): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

/** Responde 405 y devuelve false si el método no es el esperado. */
export function allow(req: Req, res: Res, method: string): boolean {
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  send(res, 405, { error: 'Método no permitido' });
  return false;
}

export function clientIp(req: Req): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

export const queryParam = (req: Req, name: string): string | undefined => {
  const v = req.query?.[name];
  return Array.isArray(v) ? v[0] : v;
};
