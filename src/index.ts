import { app } from './app';
import { env } from './config/env';

const port = process.env.PORT || 3000;
app.listen(port);

console.log(
  `🦊 Yuchi Server is running at http://${app.server?.hostname}:${app.server?.port}/${env.API_PREFIX}`,
);
console.log(
  `🦊 API Documentation: http://${app.server?.hostname}:${app.server?.port}/${env.API_PREFIX}/openapi`,
);
