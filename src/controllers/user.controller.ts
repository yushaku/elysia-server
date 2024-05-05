import { userLoginDTO } from "@/models";
import Elysia from "elysia";

export const userRouter = new Elysia({ prefix: "/users" })
  .get("/", () => "hello")
  .get(
    "/:id",
    ({ params: { id } }) => {
      return {
        id,
        name: "yushaku",
      };
    },
    {
      detail: {
        summary: "Get user by id",
        tags: ["Users"],
      },
    },
  )
  .post("/sign-in", ({ body }) => body, userLoginDTO);
