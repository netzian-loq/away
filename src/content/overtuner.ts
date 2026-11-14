/**
 * OverTuner - the low-level GPU and system tuning app. Copy is the owner's
 * brief, 2026-11-13: "a Low-Level App that touches every Surface for go
 * Beyond what a normal full optimization can do", the feature list below, and
 * "price is 40 Euro Yearly, Discussed in ticket for lifetime-Monthly".
 *
 * The feature lines say what the app does, in his words. Nothing here puts a
 * number on the result or promises one: how much a given PC gains depends on
 * its hardware, and overclocking past stock limits is the user's own call.
 */

export type OverTunerIcon = "gpu" | "game" | "system";

export interface OverTunerGroup {
  icon: OverTunerIcon;
  title: string;
  body: string;
  points: string[];
}

export const OVERTUNER = {
  name: "OverTuner",
  path: "/overtuner",
  tagline: "Past where a full optimization stops.",
  heroSubtitle:
    "One app that reaches the surfaces a normal optimization leaves alone: Nvidia limits, clocks and voltage, kernel tracing, devices and the game you are running.",
  /** Short form for the meta and Open Graph description; `description` stays
   *  the long one for llms.txt and the JSON-LD. */
  metaDescription:
    "Unlocks Nvidia GPU limits, auxiliary clocks and rail voltage offset, with fan curves and live game optimization. 40€ per year.",
  description:
    "OverTuner is a low-level tuning app for Nvidia GPUs and Windows: unlocked limits, auxiliary clocks, rail voltage offset, fan curves, fewer kernel ETW sessions and live game optimization. 40€ per year.",
  /** Euros per year. Monthly and lifetime are agreed in a Discord ticket. */
  yearlyPrice: 40,
  otherTerms: "Monthly or lifetime? Ask in a ticket and we will sort it out there.",
  cta: "Get OverTuner",
  groups: [
    {
      icon: "gpu",
      title: "Nvidia GPU, unlocked",
      body: "The controls the driver keeps out of reach, in one window.",
      points: [
        "Unlocks all Nvidia limits",
        "Unlocks auxiliary clocks",
        "Unlocks rail voltage offset",
        "Max limits for PCIe and more",
        "Custom fan curve presets, plus ones tuned by Away",
      ],
    },
    {
      icon: "game",
      title: "Live game optimization",
      body: "Launch the game, press Apply. It is detected for you.",
      points: [
        "Smart CPU reserving while the game runs",
        "Fewer kernel ETW sessions, so fewer CPU cycles spent on tracing",
      ],
    },
    {
      icon: "system",
      title: "A quieter system",
      body: "Hardware that wakes or polls for no reason gets switched off.",
      points: ["Disables wake-armed devices", "Removes extra devices", "And much more"],
    },
  ] as OverTunerGroup[],
};
