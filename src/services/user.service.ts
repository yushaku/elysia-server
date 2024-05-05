import { randomUUID } from 'crypto';
import type { Context } from 'elysia';

// In-memory user store (for demo)
const users = new Map<string, { password: string }>();

export const registerUser = async ({ body }: { body: { username: string; password: string } }) => {
  const { username, password } = body;
  if (users.has(username)) {
    throw new Error('User already exists');
  }
  users.set(username, { password });
  return { message: 'User registered successfully' };
};

export const verifyUser = (username: string, password: string) => {
  const user = users.get(username);
  return user && user.password === password;
};

export const handleUserSignin = async ({
  body,
  jwt,
  cookie: { access, refresh },
}: {
  body: { username: string; password: string };
  jwt: any;
  cookie: { access: any; refresh: any };
}) => {
  const { username, password } = body;
  if (!verifyUser(username, password)) {
    throw new Error('Invalid credentials');
  }
  // Create tokens
  const accessToken = await jwt.sign({ user_id: username, type: 'access' }, { expiresIn: '15m' });
  const refreshToken = await jwt.sign({ user_id: username, type: 'refresh' }, { expiresIn: '7d' });

  access.set({
    value: accessToken,
    httpOnly: true,
    maxAge: 15 * 60,
    path: '/',
  });

  refresh.set({
    value: refreshToken,
    httpOnly: true,
    maxAge: 7 * 86400,
    path: '/',
  });

  return { message: `Hi ${username}! Sign in Successful!` };
};

export const handleTokenRefresh = async ({
  jwt,
  cookie: { refresh, access },
  set,
}: {
  jwt: any;
  cookie: { refresh: any; access: any };
  set: any;
}) => {
  try {
    const payload = await jwt.verify(refresh.value);
    if (!payload || payload.type !== 'refresh') throw new Error();
    // Issue new access token
    const newAccessToken = await jwt.sign({ user_id: payload.user_id, type: 'access' }, { expiresIn: '15m' });
    access.set({
      value: newAccessToken,
      httpOnly: true,
      maxAge: 15 * 60,
      path: '/',
    });
    return { message: 'Access token refreshed' };
  } catch {
    set.status = 401;
    return { message: 'Invalid refresh token' };
  }
};
