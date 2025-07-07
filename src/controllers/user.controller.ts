import { userLoginDTO, userNonceDTO } from '@/validators';
import { JWT_SECRETS } from '@/setup';
import { jwt } from '@elysiajs/jwt';
import Elysia from 'elysia';
import { handleUserSignin, getUserById, getUserNonce } from '@/services/user.service';
import autoRefresh from '@/middleware/auto-refresh';

const jwtPlugin = jwt({ name: 'jwt', secret: JWT_SECRETS });

export const userRouter = new Elysia({ prefix: '/users' })
  .use(jwtPlugin)
  .use(autoRefresh)
  .post('/login', handleUserSignin, userLoginDTO)
  .get(
    '/profile',
    async ({ jwt, set, cookie: { access } }) => {
      try {
        const payload = await jwt.verify(access.value);

        if (!payload) {
          set.status = 401;
          return 'Unauthorized';
        }

        const user = await getUserById(payload.address as string);
        if (!user) {
          set.status = 404;
          return 'User not found';
        }

        return {
          message: `Hello ${user.name}!`,
          user,
        };
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
  )
  .get('/nonce/:address', getUserNonce, userNonceDTO);
