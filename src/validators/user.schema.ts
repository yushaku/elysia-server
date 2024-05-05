import { t } from 'elysia';

export const userLoginDTO = {
  body: t.Object({
    username: t.String(),
    password: t.String(),
  }),
  detail: {
    summary: 'Sign in the user',
    tags: ['authentication'],
  },
};
