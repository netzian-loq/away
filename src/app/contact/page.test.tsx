import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/contact", () => ({
  submitContactForm: vi.fn(async () => ({ status: "idle" })),
}));

import ContactPage from "./page";
import { SITE } from "@/content/site";

describe("ContactPage", () => {
  it("shows the business email and Discord link", () => {
    render(<ContactPage />);
    expect(screen.getByText(SITE.email)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Join our Discord/i })).toHaveAttribute("href", SITE.discordServerUrl);
  });
});
