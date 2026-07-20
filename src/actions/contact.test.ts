import { describe, expect, it, vi, beforeEach } from "vitest";

const { sendContactEmail } = vi.hoisted(() => ({ sendContactEmail: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendContactEmail }));

import { submitContactForm, type ContactActionState } from "./contact";

function toFormData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const initialState: ContactActionState = { status: "idle" };
const validFields = {
  name: "Logan",
  discord: "logan#0001",
  specs: "5800X3D / 4080",
  message: "Need my rig tuned for Valorant, current FPS feels low.",
  company: "",
  startedAt: String(Date.now() - 5000),
};

describe("submitContactForm", () => {
  beforeEach(() => {
    sendContactEmail.mockReset();
    sendContactEmail.mockResolvedValue({ data: { id: "1" }, error: null });
  });

  it("sends the email and returns success for a valid, human-timed submission", async () => {
    const result = await submitContactForm(initialState, toFormData(validFields));
    expect(sendContactEmail).toHaveBeenCalledWith({
      name: "Logan",
      discord: "logan#0001",
      specs: "5800X3D / 4080",
      message: validFields.message,
    });
    expect(result.status).toBe("success");
  });

  it("returns a validation error and never sends when required fields are missing", async () => {
    const result = await submitContactForm(initialState, toFormData({ ...validFields, name: "" }));
    expect(result.status).toBe("error");
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it("silently succeeds without sending when the honeypot field is filled", async () => {
    const result = await submitContactForm(
      initialState,
      toFormData({ ...validFields, company: "I am a bot" }),
    );
    expect(result.status).toBe("success");
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it("silently succeeds without sending when the form was submitted too fast", async () => {
    const result = await submitContactForm(
      initialState,
      toFormData({ ...validFields, startedAt: String(Date.now()) }),
    );
    expect(result.status).toBe("success");
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it("returns an error if sending the email fails", async () => {
    sendContactEmail.mockRejectedValue(new Error("network down"));
    const result = await submitContactForm(initialState, toFormData(validFields));
    expect(result.status).toBe("error");
  });
});
