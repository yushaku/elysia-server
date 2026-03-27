// Controller handle HTTP related eg. routing, request validation
import { Elysia } from 'elysia';
import { prisma } from '@/config/database';
import { getRedis } from '@/config/redis';
import { log } from '@/utils/logger';
import { HealthModel } from './model';
import { NotFoundException } from '@/utils/exceptions';

export const health = new Elysia({ prefix: '/health' })
  .get(
    '/',
    async () => {
      const timestamp = new Date().toISOString();

      // Default statuses
      let postgresStatus: 'ok' | 'error' = 'ok';
      let redisStatus: 'ok' | 'error' = 'ok';

      // Check PostgreSQL
      try {
        // Lightweight query just to ensure connection is healthy
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        postgresStatus = 'error';
        log.error({ event: 'health.postgres.error', err: error }, 'PostgreSQL connection error');
      }

      // Check Redis
      try {
        const redis = getRedis();
        await redis.ping();
      } catch (error) {
        redisStatus = 'error';
        log.error({ event: 'health.redis.error', err: error }, 'Redis connection error');
      }

      const overallStatus = postgresStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded';

      return {
        success: true,
        data: {
          status: overallStatus,
          timestamp,
          uptime: process.uptime(),
          services: {
            postgres: postgresStatus,
            redis: redisStatus,
          },
        },
      };
    },
    {
      detail: {
        summary: 'Health Check',
        description:
          'Returns the health status of the API server, including PostgreSQL and Redis connectivity',
        tags: ['health'],
      },
      response: {
        200: HealthModel.healthResponse,
      },
    },
  )
  .get(
    '/test-error',
    async () => {
      throw new NotFoundException('Test error');
    },
    {
      detail: {
        summary: 'Test Error',
        description: 'Test error',
        tags: ['health'],
      },
      response: {
        500: HealthModel.healthResponse,
      },
    },
  );
