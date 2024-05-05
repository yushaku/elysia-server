import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { userRouter } from "./controllers";

export const app = new Elysia()
  .use(swagger({ path: "docs" }))
  .use(cors())
  .use(userRouter)
  .get("/", () => "Hello Elysia")
  .onError(({ code, error }) => {
    if (code === "VALIDATION") return error.message;
  })
  .listen(3000);

console.log(`🦊 is running at ${app.server?.hostname}:${app.server?.port}`);
