import Image from "next/image";
import { cn } from "@/lib/utils";

/** The rendered icon set in /public/icons. Built by tools/icons/build_icons.py. */
export type Icon3dName =
  | "ram"
  | "cpu"
  | "gpu"
  | "bios"
  | "disk"
  | "rocket"
  | "monitor"
  | "bolt"
  | "network"
  | "gauge"
  | "gamepad"
  | "layers"
  | "shield"
  | "social-discord"
  | "social-x"
  | "social-youtube";

/**
 * One of the site's own icons: a small object modelled and rendered in
 * Blender, not a line glyph. Decorative, so the alt text is empty and the
 * title beside it carries the meaning. Drawn straight on the card with no
 * tile behind it; the render already has its own light and edge.
 */
export function Icon3d({ name, size = 56, className }: { name: Icon3dName; size?: number; className?: string }) {
  return (
    <Image
      src={`/icons/${name}.webp`}
      alt=""
      width={size}
      height={size}
      // Fixed box and self-start: as a flex child an image otherwise stretches
      // to the height of the row and the render is squashed.
      style={{ width: size, height: size }}
      className={cn("shrink-0 self-start object-contain select-none", className)}
      draggable={false}
    />
  );
}
