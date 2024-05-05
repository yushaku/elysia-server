import { describe, expect, it } from "bun:test";
import apis from "@/index";

describe("Elysia", () => {
  it("return a response", async () => {
    const { data } = await apis.index.get();
    expect(data).toBe("Hello Elysia");
  });
});
