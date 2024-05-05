import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "@/index";

const apis = treaty(app);

describe("Elysia", () => {
  it("return a response", async () => {
    const { data } = await apis.index.get();
    expect(data).toBe("Hello Elysia");
  });
});
