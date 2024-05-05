import { t } from "elysia";

export const userLoginDTO = {
  body: t.Object(
    {
      username: t.String(),
      password: t.String(),
    },
    {
      description: "Expected an username and password",
    },
  ),
  detail: {
    summary: "Sign in the user",
    tags: ["authentication"],
  },
};
