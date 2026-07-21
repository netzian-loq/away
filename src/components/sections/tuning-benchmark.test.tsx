import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TuningBenchmark } from "./tuning-benchmark";

describe("TuningBenchmark", () => {
  it("renders the starting FPS/latency values and the tuning status", () => {
    render(<TuningBenchmark />);
    expect(screen.getByText("Scroll to tune")).toBeInTheDocument();
    expect(screen.getByText("144")).toBeInTheDocument();
    expect(screen.getByText("18.4")).toBeInTheDocument();
    expect(screen.getByText("Tuning…")).toBeInTheDocument();
  });
});
