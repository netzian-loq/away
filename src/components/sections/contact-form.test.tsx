import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/contact", () => ({
  submitContactForm: vi.fn(async (_prev: unknown, formData: FormData) => {
    const name = formData.get("name");
    if (!name) return { status: "error", message: "Enter your name" };
    return { status: "success" };
  }),
}));

import { ContactForm } from "./contact-form";

describe("ContactForm", () => {
  it("shows a success message after a valid submission", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Name"), "Logan");
    await user.type(screen.getByLabelText("Discord Username"), "logan#0001");
    await user.type(screen.getByLabelText("Message"), "Need my rig tuned for Valorant.");
    await user.click(screen.getByRole("button", { name: /Send Request/i }));

    expect(await screen.findByText("Request sent.")).toBeInTheDocument();
  });
});
