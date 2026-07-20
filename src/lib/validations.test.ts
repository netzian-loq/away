import { describe, expect, it } from "vitest";
import { contactFormSchema } from "./validations";

describe("contactFormSchema", () => {
  it("accepts a fully valid submission", () => {
    const result = contactFormSchema.safeParse({
      name: "Logan",
      discord: "logan#0001",
      specs: "5800X3D / 4080 / 32GB",
      message: "Need my rig tuned for Valorant, current FPS feels low.",
      company: "",
      startedAt: String(Date.now()),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = contactFormSchema.safeParse({
      name: "",
      discord: "logan#0001",
      message: "Need my rig tuned for Valorant.",
      startedAt: String(Date.now()),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short message", () => {
    const result = contactFormSchema.safeParse({
      name: "Logan",
      discord: "logan#0001",
      message: "hi",
      startedAt: String(Date.now()),
    });
    expect(result.success).toBe(false);
  });

  it("allows specs to be omitted", () => {
    const result = contactFormSchema.safeParse({
      name: "Logan",
      discord: "logan#0001",
      message: "Need my rig tuned for Valorant, current FPS feels low.",
      startedAt: String(Date.now()),
    });
    expect(result.success).toBe(true);
  });
});
