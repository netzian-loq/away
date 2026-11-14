import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteCurtain } from "./route-curtain";

const push = vi.fn();
const nav = { pathname: "/" };

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push, prefetch: vi.fn() }),
}));

/**
 * Clicks a fresh anchor and reports whether the curtain prevented it. A
 * bubble-phase listener reads the flag after the curtain's capture listener
 * has run, then cancels the click itself so jsdom never tries to navigate.
 */
function click(href: string, init: MouseEventInit = {}, attrs: Record<string, string> = {}) {
  const anchor = document.createElement("a");
  anchor.href = href;
  for (const [name, value] of Object.entries(attrs)) anchor.setAttribute(name, value);
  document.body.appendChild(anchor);
  let prevented = false;
  const probe = (event: Event) => {
    prevented = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener("click", probe);
  act(() => {
    fireEvent.click(anchor, { button: 0, ...init });
  });
  document.removeEventListener("click", probe);
  anchor.remove();
  return prevented;
}

/**
 * jsdom has no AnimationEvent, so React listens for the webkit-prefixed name
 * there instead of `animationend`.
 */
function endAnimation(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new Event("webkitAnimationEnd", { bubbles: true }));
  });
}

describe("RouteCurtain", () => {
  beforeEach(() => {
    push.mockClear();
    nav.pathname = "/";
    window.history.replaceState(null, "", "/");
  });
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("intercepts an internal link to another path and pushes immediately", () => {
    const { container } = render(<RouteCurtain />);
    expect(click("/services")).toBe(true);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/services");
    expect(container.querySelector(".route-curtain-in")).not.toBeNull();
  });

  it("leaves same-path, hash-only, external, new-tab and modified clicks alone", () => {
    const { container } = render(<RouteCurtain />);
    expect(click("/")).toBe(false);
    expect(click("/?x=1")).toBe(false);
    expect(click("#pricing")).toBe(false);
    expect(click("https://example.com/services")).toBe(false);
    expect(click("/services", {}, { target: "_blank" })).toBe(false);
    expect(click("/services", { ctrlKey: true })).toBe(false);
    expect(click("/services", { metaKey: true })).toBe(false);
    expect(click("/services", { shiftKey: true })).toBe(false);
    expect(push).not.toHaveBeenCalled();
    expect(container.querySelector(".route-curtain")).toBeNull();
  });

  it("blocks a second link click while the cover is wiping in", () => {
    render(<RouteCurtain />);
    click("/services");
    expect(click("/about")).toBe(true);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("lifts only once both the wipe has ended and the path has changed", () => {
    const { container, rerender } = render(<RouteCurtain />);
    click("/services");
    const cover = container.querySelector(".route-curtain") as HTMLElement;

    // Path first: still covered until the wipe-in finishes.
    nav.pathname = "/services";
    rerender(<RouteCurtain />);
    expect(container.querySelector(".route-curtain-in")).not.toBeNull();

    endAnimation(cover);
    expect(container.querySelector(".route-curtain-out")).not.toBeNull();
  });

  it("does not swallow clicks once the new page is showing", () => {
    const { container, rerender } = render(<RouteCurtain />);
    click("/services");
    endAnimation(container.querySelector(".route-curtain") as HTMLElement);
    nav.pathname = "/services";
    window.history.replaceState(null, "", "/services");
    rerender(<RouteCurtain />);
    expect(container.querySelector(".route-curtain-out")).not.toBeNull();

    // Same-path link during the lift navigates normally.
    expect(click("/services#faq")).toBe(false);
    // A link elsewhere starts a fresh transition instead of being dropped.
    expect(click("/about")).toBe(true);
    expect(push).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenLastCalledWith("/about");
    expect(container.querySelector(".route-curtain-in")).not.toBeNull();
  });

  it("lifts the cover if the path never changes", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<RouteCurtain />);
      click("/services");
      act(() => {
        vi.advanceTimersByTime(7999);
      });
      expect(container.querySelector(".route-curtain-in")).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(container.querySelector(".route-curtain-out")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
