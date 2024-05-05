import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';

import { userRouter } from './controllers';

export const app = new Elysia()
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'Elysia Server API',
          version: '1.0.0',
          description: 'A modern API server built with Elysia.js',
          contact: {
            name: 'API Support',
            email: 'support@example.com',
          },
        },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Development server',
          },
        ],
        tags: [
          {
            name: 'Users',
            description: 'User management endpoints',
          },
          {
            name: 'authentication',
            description: 'Authentication and authorization endpoints',
          },
        ],
      },
    }),
  )
  .use(cors())
  .use(userRouter)
  .get('/', () => 'Hello Elysia')
  .onError(({ code, error }) => {
    if (code === 'VALIDATION') return error.message;
  })
  .listen(3000);

console.log(`🦊 is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 Swagger documentation available at http://localhost:3000/docs`);
