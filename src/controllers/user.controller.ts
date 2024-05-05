import Elysia from "elysia";

export const userRouter = new Elysia({ prefix: "/users" })
  .get("/", () => "hello")
  .get("/:id", ({ params: { id } }) => {
    return {
      id,
      name: "yushaku",
    };
  })
  .post("/", () => "world");
