import { t } from 'elysia';

export const userLoginDTO = {
  body: t.Object({
    signature: t.String({
      description: 'User signature',
      examples: ['0x1234567890123456789012345678901234567890'],
    }),
    data: t.Object({
      nonce: t.Number({
        description: 'User nonce',
        examples: [1],
      }),
      timestamp: t.Number({
        description: 'User timestamp in milliseconds',
        examples: [1715142000],
      }),
      address: t.String({
        description: 'User address',
        examples: ['0x1234567890123456789012345678901234567890'],
        regex: /^0x[a-fA-F0-9]{40}$/,
      }),
    }),
  }),
  detail: {
    summary: 'Sign in the user',
    tags: ['authentication'],
  },
};

export const userNonceDTO = {
  params: t.Object({
    address: t.String({
      description: 'User address',
      examples: ['0x1234567890123456789012345678901234567890'],
      regex: /^0x[a-fA-F0-9]{40}$/,
    }),
  }),
  detail: {
    summary: 'Get User Nonce',
    tags: ['Users'],
  },
};
