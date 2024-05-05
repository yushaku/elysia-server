import type { Elysia } from 'elysia';

// Middleware to auto-refresh access token if expired
const autoRefresh = (app: Elysia) =>
  app.onBeforeHandle(async (ctx) => {
    const {
      jwt,
      cookie: { access, refresh },
      set,
    } = ctx as any;
    if (!access?.value) return;
    try {
      await jwt.verify(access.value);
    } catch {
      // Access token expired, try to refresh
      if (refresh?.value) {
        const payload = await jwt.verify(refresh.value);
        if (payload && payload.type === 'refresh') {
          const newAccessToken = await jwt.sign(
            { user_id: payload.user_id, type: 'access' },
            { expiresIn: '15m' },
          );
          access.set({
            value: newAccessToken,
            httpOnly: true,
            maxAge: 15 * 60,
            path: '/',
          });
        } else {
          set.status = 401;
        }
      } else {
        set.status = 401;
      }
    }
  });

export default autoRefresh;
