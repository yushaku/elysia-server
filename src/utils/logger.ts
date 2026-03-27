import pino from 'pino';
import { env } from '@/config/env';
import type { Logger } from 'pino';

export const log: Logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'elysia-server',
    env: env.NODE_ENV,
  },
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime,
});
