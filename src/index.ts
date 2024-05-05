import { Elysia } from "elysia";
import { userRouter } from "./controllers";

const app = new Elysia().use(userRouter).get("/", () => "Hello Elysia");

app.listen(3000);
console.log(`🦊 is running at ${app.server?.hostname}:${app.server?.port}`);
