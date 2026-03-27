import { Elysia, status } from 'elysia';
import { env } from '@/config/env';
import { logger } from '@/middleware/logger';
import { metrics } from '@/middleware/metrics';
import { corsMiddleware } from '@/middleware/cors';
import { errorHandler } from '@/middleware/error-handler';
import { swaggerPlugin } from '@/middleware/swagger';
import { health } from '@/modules/health';
import { user } from '@/modules/user';

export const app = new Elysia({ prefix: env.API_PREFIX })
  .use(swaggerPlugin)
  .use(logger)
  .use(metrics)
  .use(corsMiddleware)
  .get(
    '/',
    () => ({
      message: 'Welcome to Elysia API',
      version: '1.0.0',
      docs: '/openapi',
      health: '/health',
    }),
    {
      detail: {
        summary: 'API Welcome',
        tags: ['general'],
      },
    },
  )
  // ROUTES HERE
  .onError(errorHandler)
  .use(health)
  .use(user);

export type App = typeof app;
export default app;
