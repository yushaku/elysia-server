// User data controller - handles user-related endpoints
import { Elysia, t } from 'elysia';
import { jwtPlugin, verifyToken } from '@/middleware/auth';
import { UserService } from './user.service';
import { UserModel } from './model';

export const userController = new Elysia({ prefix: '/user' }).use(jwtPlugin).get(
  '/me',
  async ({ request, jwt }) => {
    const userId = await verifyToken({ request, jwt });
    const user = await UserService.getUserById(userId);
    return {
      success: true,
      data: { user },
    };
  },
  {
    detail: {
      summary: 'Get current authenticated user',
      description: 'Returns the current user',
      tags: ['user'],
      security: [{ BearerAuth: [] }],
    },
    response: {
      200: UserModel.currentUserResponse,
      401: t.Object({ error: t.String(), message: t.Optional(t.String()) }),
      404: t.Object({ error: t.String(), message: t.Optional(t.String()) }),
    },
  },
);
