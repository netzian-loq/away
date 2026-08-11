import Lenis from "lenis";

/**
 * The site's single scroll engine.
 *
 * Everything scroll-driven on the page — the smoothing, the progress rail, the
 * nav's condensed state, the parallax and scale and word-reveal effects, and
 * the quality switch that drops expensive paint work while the page is moving —
 * reads from this one module.
 *
 * That's the whole point of it. Before, each effect owned its own
 * `useScroll()`, which meant a handful of independent rAF loops and a
 * `getBoundingClientRect()` per effect per frame — a forced layout on every
 * frame of every scroll. Here there is exactly one rAF loop, one read of
 * `window.scrollY`, and one broadcast; element geometry is measured on resize
 * and cached, never in the frame loop.
 *
 * The loop also stops. A permanently-running rAF pinned to 60fps costs battery
 * and keeps the main thread awake for nothing; this one idles out a few frames
 * after the page stops moving and is woken by the input events that can start a
 * scroll.
 */

export type ScrollPhase = "idle" | "moving" | "fast";

export interface ScrollState {
  /** Scroll offset in px, as the page is actually painted this frame. */
  y: number;
  /** Signed change in `y` since the previous frame, in px. */
  velocity: number;
  /** 0–1 through the document's scrollable length. */
  progress: number;
  phase: ScrollPhase;
}

type Listener = (state: ScrollState) => void;

/**
 * Phase thresholds, in px moved per frame (so ~×60 for px/second).
 *
 * `fast` is the interesting one: it's the signal the stylesheet uses to switch
 * off backdrop blur, the pointer spotlight and the cursor glow. Two thresholds
 * rather than one because a single boundary makes the attribute flicker on and
 * off while scrolling right at it, and every flip is a style invalidation.
 */
const FAST_ENTER = 14;
const FAST_EXIT = 6;
const MOVING_ENTER = 0.35;

/** Frames of stillness before the loop is allowed to stop. */
const IDLE_FRAMES = 10;

/** Lenis' own tuning. See `SmoothScroll` for why touch never gets here. */
const LENIS_OPTIONS = {
  /**
   * `lerp` instead of `duration`. A duration-based ease has to finish its
   * curve no matter what arrives next, so a burst of wheel events queues up
   * behind a 1.5s tail and the page keeps gliding long after the hand stopped
   * — the "floaty, laggy" feel, and 90 frames of scroll-linked work per notch.
   * A lerp converges toward wherever the target is *now*, so a fast flick
   * catches up in a few frames instead of stacking.
   */
  lerp: 0.11,
  wheelMultiplier: 1,
  smoothWheel: true,
  /** In-page links (the hero chevron) glide instead of jumping. */
  anchors: true,
} as const;

/**
 * Which phase a given frame's speed belongs to, given the phase before it.
 *
 * Pure and exported so the hysteresis is actually testable: the previous phase
 * is an input because `fast` holds on down to `FAST_EXIT` once entered, which
 * is the only thing stopping the attribute — and every style invalidation
 * behind it — from flapping while scrolling right at the threshold.
 */
export function resolveScrollPhase(speed: number, previous: ScrollPhase): ScrollPhase {
  if (speed < MOVING_ENTER) return "idle";
  if (speed >= FAST_ENTER) return "fast";
  if (previous === "fast" && speed > FAST_EXIT) return "fast";
  return "moving";
}

function prefersLightMotion(): boolean {
  // Set before first paint by the inline script in the root layout: either
  // prefers-reduced-motion, or no hardware GPU behind the canvas.
  return document.documentElement.classList.contains("perf-lite");
}

class ScrollEngine {
  private listeners = new Set<Listener>();
  private state: ScrollState = { y: 0, velocity: 0, progress: 0, phase: "idle" };
  private lenis: Lenis | null = null;
  private frame = 0;
  private stillFrames = 0;
  private looping = false;
  private mounted = false;
  /** Scrollable length, cached — see `measureDocument`. */
  private maxScroll = 0;
  private resizeObserver: ResizeObserver | null = null;

  /** Idempotent: the first subscriber mounts the engine, the rest join it. */
  mount() {
    if (this.mounted || typeof window === "undefined") return;
    this.mounted = true;

    this.measureDocument();
    // Watches the content, not just the window: images finishing, the mobile
    // menu opening and route changes all change the scrollable length without
    // a resize event, and a stale length shows up directly as a progress rail
    // that never reaches the end.
    this.resizeObserver = new ResizeObserver(this.measureDocument);
    this.resizeObserver.observe(document.body);

    this.state.y = window.scrollY;
    this.state.progress = this.progressFor(this.state.y);
    // Published up front rather than waiting for the first phase *change*, so
    // the attribute is always present to read and to style against.
    document.documentElement.dataset.scroll = this.state.phase;

    // Smoothing is a desktop-with-a-GPU luxury. On touch, taking scrolling
    // over from the compositor and re-driving it from JS trades hardware
    // momentum for a main-thread loop that has to keep up with a finger, and
    // it loses; on `perf-lite` there's either no GPU or the reader asked for
    // less motion. Both keep native scrolling, and both still get every
    // scroll-linked effect below, driven off the native scroll position.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!coarse && !prefersLightMotion()) {
      this.lenis = new Lenis({ ...LENIS_OPTIONS });
    }

    for (const type of WAKE_EVENTS) {
      window.addEventListener(type, this.wake, { passive: true });
    }
    // Separate from the wake listener: a phone hiding its URL bar changes the
    // viewport height without changing the body's size, so the observer above
    // never fires for it.
    window.addEventListener("resize", this.measureDocument, { passive: true });
    this.startLoop();
  }

  unmount() {
    if (!this.mounted) return;
    this.mounted = false;
    for (const type of WAKE_EVENTS) window.removeEventListener(type, this.wake);
    window.removeEventListener("resize", this.measureDocument);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    cancelAnimationFrame(this.frame);
    this.looping = false;
    this.lenis?.destroy();
    this.lenis = null;
    document.documentElement.removeAttribute("data-scroll");
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Hand over the current position immediately so a component that mounts
    // mid-page renders correctly instead of waiting for the next scroll.
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): ScrollState {
    return this.state;
  }

  private wake = () => {
    this.stillFrames = 0;
    this.startLoop();
  };

  private startLoop() {
    if (this.looping || !this.mounted) return;
    this.looping = true;
    this.frame = requestAnimationFrame(this.tick);
  }

  /**
   * Re-reads the scrollable length. Deliberately not done in the frame loop:
   * `scrollHeight` forces layout, and doing that every frame — in the very
   * loop whose subscribers are about to write styles — is the read/write
   * thrash this engine exists to get rid of.
   */
  private measureDocument = () => {
    this.maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  };

  private progressFor(y: number) {
    return this.maxScroll > 0 ? Math.min(1, Math.max(0, y / this.maxScroll)) : 0;
  }

  private tick = (time: number) => {
    this.lenis?.raf(time);

    const y = window.scrollY;
    const velocity = y - this.state.y;
    const speed = Math.abs(velocity);
    const phase = resolveScrollPhase(speed, this.state.phase);

    if (phase !== this.state.phase) {
      // One attribute write per phase change — not per frame. The stylesheet
      // keys the expensive-effect switches off it.
      document.documentElement.dataset.scroll = phase;
    }

    this.state = { y, velocity, progress: this.progressFor(y), phase };
    for (const listener of this.listeners) listener(this.state);

    this.stillFrames = speed < MOVING_ENTER ? this.stillFrames + 1 : 0;

    // Lenis can still be mid-animation while the page is barely moving (the
    // tail of an ease), and stopping the loop there would freeze it short of
    // its target.
    if (this.stillFrames > IDLE_FRAMES && !this.lenis?.isScrolling) {
      this.looping = false;
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };
}

/**
 * Everything that can begin a scroll. `scroll` itself covers programmatic
 * jumps, anchor navigation and scrollbar drags; the rest wake the loop on the
 * same frame as the input rather than one frame late.
 */
const WAKE_EVENTS = ["scroll", "wheel", "touchstart", "touchmove", "keydown", "resize"] as const;

export const scrollEngine = new ScrollEngine();

/* -------------------------------------------------------------------------- */
/*  Element tracking                                                          */
/* -------------------------------------------------------------------------- */

/** Which edge of the tracked element the offset is measured from. */
type Edge = "start" | "center" | "end";

/**
 * An offset pair, read as "this edge of the element, at this fraction down the
 * viewport". `["start", 1]` is the element's top touching the bottom of the
 * viewport; `["end", 0]` is its bottom touching the top.
 */
export type ScrollOffset = readonly [Edge, number];

export interface TrackOptions {
  from: ScrollOffset;
  to: ScrollOffset;
  /**
   * How far outside the viewport the element still gets updates, as a
   * fraction of viewport height. Keeps a tall element's effect correct while
   * its far edge is still on screen.
   */
  overscan?: number;
}

/** An element's layout box and the viewport it's being read against. */
export interface TrackGeometry {
  /** Distance from the top of the document to the element's top, in px. */
  top: number;
  height: number;
  viewport: number;
}

/** The scroll position at which `offset`'s edge sits where it asks to. */
export function scrollPositionFor(
  { top, height, viewport }: TrackGeometry,
  [edge, fraction]: ScrollOffset,
): number {
  const edgeTop = edge === "start" ? top : edge === "center" ? top + height / 2 : top + height;
  return edgeTop - viewport * fraction;
}

/**
 * Progress, 0–1 clamped, of an element between two scroll offsets. Pure — the
 * whole point of splitting it out is that the geometry arrives as numbers, so
 * the arithmetic can be checked without a layout engine.
 */
export function trackProgress(
  geometry: TrackGeometry,
  scrollY: number,
  { from, to, overscan = 0.15 }: TrackOptions,
): number {
  const { top, height, viewport } = geometry;
  const pad = viewport * overscan;
  const relative = top - scrollY;
  // Fully past the viewport in either direction: hold the end value rather
  // than keep interpolating something nobody can see.
  if (relative > viewport + pad) return 0;
  if (relative + height < -pad) return 1;

  const start = scrollPositionFor(geometry, from);
  const span = scrollPositionFor(geometry, to) - start;
  if (span === 0) return 1;
  return Math.min(1, Math.max(0, (scrollY - start) / span));
}

/**
 * Calls `onProgress` with a clamped 0–1 as the element crosses the viewport.
 *
 * Geometry comes from `offsetTop`/`offsetHeight` rather than
 * `getBoundingClientRect()`, and is re-read only on resize or when the element
 * itself changes size. Two reasons: rect reads inside the frame loop force
 * layout, and — the subtle one — a rect includes the element's own transform,
 * so an effect that *writes* a transform here would be measuring its own
 * output and drifting. Offsets are pure layout values and ignore transforms.
 */
export function trackElement(
  element: HTMLElement,
  options: TrackOptions,
  onProgress: (progress: number) => void,
): () => void {
  let geometry: TrackGeometry = { top: 0, height: 0, viewport: 0 };
  let last = -1;

  const measure = () => {
    let offset = 0;
    let node: HTMLElement | null = element;
    while (node) {
      offset += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    geometry = { top: offset, height: element.offsetHeight, viewport: window.innerHeight };
    last = -1; // force the next frame to re-emit against the new geometry
  };

  const emit = ({ y }: ScrollState) => {
    const progress = trackProgress(geometry, y, options);
    // Sub-pixel changes aren't visible but still cost a style invalidation.
    if (Math.abs(progress - last) < 0.0005) return;
    last = progress;
    onProgress(progress);
  };

  measure();
  scrollEngine.mount();
  const unsubscribe = scrollEngine.subscribe(emit);

  const observer = new ResizeObserver(measure);
  observer.observe(element);
  window.addEventListener("resize", measure, { passive: true });

  return () => {
    unsubscribe();
    observer.disconnect();
    window.removeEventListener("resize", measure);
  };
}
