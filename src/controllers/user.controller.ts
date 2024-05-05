import { userLoginDTO } from "@/models";
import { JWT_SECRETS } from "@/setup";
import { jwt } from "@elysiajs/jwt";
import Elysia from "elysia";

export const userRouter = new Elysia({ prefix: "/users" })
  .use(jwt({ name: "jwt", secret: JWT_SECRETS }))
  .post(
    "/sign-in",
    async ({ body, jwt, cookie: { auth } }) => {
      const { username, password } = body;

      auth.set({
        value: await jwt.sign({ user_id: 1 }),
        httpOnly: true,
        maxAge: 7 * 86400,
        path: "*",
      });

      return `Hi ${username}! Sign in Successful!`;
    },
    userLoginDTO,
  )
  .get(
    "/profile",
    async ({ jwt, set, cookie: { auth } }) => {
      const profile = await jwt.verify(auth.value);

      if (!profile) {
        set.status = 401;
        return "Unauthorized";
      }

      return `Hello ${profile.user_id}`;
    },
    {
      detail: {
        summary: "Get user profile",
        tags: ["Users"],
      },
    },
  );
