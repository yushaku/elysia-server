import { Elysia } from 'elysia';
import { ulid } from 'ulid';
import { log as baseLog } from '@/utils/logger';
import type { Logger } from 'pino';

type RequestLogMeta = {
  requestId: string;
  requestStartMs: number;
  log: Logger;
};

const requestMeta = new WeakMap<Request, RequestLogMeta>();

function getOrCreateMeta(request: Request, set?: any): RequestLogMeta {
  const existing = requestMeta.get(request);
  if (existing) return existing;

  const incoming = request.headers.get('x-request-id') ?? request.headers.get('X-Request-Id');
  const requestId = (incoming && incoming.trim()) || ulid();

  if (set) set.headers['x-request-id'] = requestId;

  const created: RequestLogMeta = {
    requestId,
    requestStartMs: performance.now(),
    log: baseLog.child({ requestId }),
  };
  requestMeta.set(request, created);
  return created;
}

export const logger = new Elysia({ name: 'logger' })
  .derive({ as: 'global' }, ({ request }) => ({
    // Inject request_id vào mọi request — dùng header nếu có (từ load balancer),
    requestId: request.headers.get('x-request-id') ?? ulid(),
    startTime: performance.now(),
  }))
  .onAfterResponse(({ request, set }) => {
    const meta = getOrCreateMeta(request, set);
    const url = new URL(request.url);
    const durationMs = Math.round((performance.now() - meta.requestStartMs) * 100) / 100;

    meta.log.info(
      {
        event: 'request.end',
        method: request.method,
        path: url.pathname,
        status: set.status ?? 200,
        durationMs,
        requestId: meta.requestId,
      },
      'request completed',
    );
    requestMeta.delete(request);
  })
  .onError(({ error, request, set }) => {
    const meta = getOrCreateMeta(request, set);
    const url = new URL(request.url);
    meta.log.error(
      {
        event: 'request.error',
        method: request.method,
        path: url.pathname,
        requestId: meta.requestId,
        errorName: error instanceof Error ? error.name : 'Error',
        errorMessage: error instanceof Error ? error.message : String(error),
        stack:
          error instanceof Error && process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      },
      'request error',
    );
  });
