import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import React from "react";

// Nearly every component/page test below renders `next/link` and queries the
// resulting <a> via getByRole("link", ...). Rendering the real next/link
// outside an actual Next.js app router context is version-sensitive and a
// common source of flaky tests, so it's mocked once, globally, as a plain
// anchor — these are unit tests of our own components, not of next/link.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string | { pathname?: string };
  }) =>
    React.createElement(
      "a",
      { href: typeof href === "string" ? href : (href?.pathname ?? "#"), ...props },
      children,
    ),
}));

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(_callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// jsdom doesn't implement IntersectionObserver — several components use it.
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// jsdom doesn't implement matchMedia either — video-showcase.tsx checks
// prefers-reduced-motion before starting its GSAP effect. Default to
// "not matched" (i.e. motion allowed) so tests exercise the normal path.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
