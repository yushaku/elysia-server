import { userLoginDTO } from '@/validators';
import { JWT_SECRETS } from '@/setup';
import { jwt } from '@elysiajs/jwt';
import Elysia from 'elysia';
import { handleUserSignin, registerUser, handleTokenRefresh } from '@/services/user.service';
import autoRefresh from '@/middleware/auto-refresh';

const jwtPlugin = jwt({ name: 'jwt', secret: JWT_SECRETS });

export const userRouter = new Elysia({ prefix: '/users' })
  .use(jwtPlugin)
  .use(autoRefresh)
  .post('/register', registerUser, {
    body: userLoginDTO.body,
    detail: {
      summary: 'Register user',
      tags: ['authentication'],
    },
  })
  .post('/sign-in', handleUserSignin, {
    ...userLoginDTO,
    detail: {
      summary: 'User Sign In',
      tags: ['authentication'],
    },
  })
  .post('/refresh', handleTokenRefresh, {
    detail: {
      summary: 'Refresh access token',
      tags: ['authentication'],
    },
  })
  .get(
    '/profile',
    async ({ jwt, set, cookie: { access } }) => {
      try {
        const profile = await jwt.verify(access.value);

        if (!profile) {
          set.status = 401;
          return 'Unauthorized';
        }

        return `Hello ${profile.user_id}`;
      } catch {
        set.status = 401;
        return 'Unauthorized';
      }
    },
    {
      detail: {
        summary: 'Get User Profile',
        tags: ['Users'],
      },
    },
  );
