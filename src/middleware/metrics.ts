import { Elysia } from 'elysia';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
  type CounterConfiguration,
  type HistogramConfiguration,
} from 'prom-client';

const registry = new Registry();

collectDefaultMetrics({ register: registry });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
} satisfies CounterConfiguration<string>);

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
} satisfies HistogramConfiguration<string>);

function normalizeRoute(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  const normalized = parts.map((p) => {
    if (/^[0-9]+$/.test(p)) return ':id';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p)) return ':id';
    if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(p)) return ':id'; // ULID
    return p;
  });
  return '/' + normalized.join('/');
}

export const metrics = new Elysia({ name: 'metrics' })
  .decorate('metricsStartMs', 0 as number)
  .derive(({ request }) => ({
    metricsStartMs: performance.now(),
    metricsRoute: normalizeRoute(new URL(request.url).pathname),
  }))
  .onAfterHandle(({ request, set, metricsStartMs, metricsRoute }) => {
    if (metricsRoute.endsWith('/metrics')) return;

    const status = String(set.status ?? 200);
    const durationSeconds = (performance.now() - metricsStartMs) / 1000;

    httpRequestsTotal.inc({
      method: request.method,
      route: metricsRoute,
      status,
    });

    httpRequestDurationSeconds.observe(
      {
        method: request.method,
        route: metricsRoute,
        status,
      },
      durationSeconds,
    );
  })
  .get('/metrics', async ({ set }) => {
    set.headers['content-type'] = registry.contentType;
    return await registry.metrics();
  });
