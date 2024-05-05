import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { userRouter } from "./controllers";

const app = new Elysia()
  .use(swagger({ path: "docs" }))
  .use(userRouter)
  .get("/", () => "Hello Elysia");

app.listen(3000);
console.log(`🦊 is running at ${app.server?.hostname}:${app.server?.port}`);
