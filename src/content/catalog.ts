import { PRICING_TIERS } from "./pricing";
import { SERVICES } from "./services";

/**
 * Everything that can be bought, in one list.
 *
 * Bundles and individual services are priced in two different content files
 * because they're presented differently, but checkout must not care about that
 * distinction — it takes a slug and looks the price up here. This is the only
 * table the payment paths consult, which is what keeps the browser from ever
 * naming its own price.
 */

export type PurchasableKind = "bundle" | "service";

export interface Purchasable {
  slug: string;
  name: string;
  price: number;
  kind: PurchasableKind;
  /** One line for the checkout selector. */
  blurb: string;
  featured?: boolean;
}

export const CATALOG: Purchasable[] = [
  ...PRICING_TIERS.map(
    (tier): Purchasable => ({
      slug: tier.slug,
      name: tier.name,
      price: tier.price,
      kind: "bundle",
      blurb: tier.features.join(" · "),
      featured: tier.featured,
    }),
  ),
  ...SERVICES.map(
    (service): Purchasable => ({
      slug: service.slug,
      name: service.title,
      price: service.priceValue,
      kind: "service",
      blurb: service.summary,
    }),
  ),
];

export const BUNDLES = CATALOG.filter((item) => item.kind === "bundle");
export const SINGLE_SERVICES = CATALOG.filter((item) => item.kind === "service");

/** Server-side price lookup — the browser only ever sends a slug. */
export function findPurchasable(slug: string | null | undefined): Purchasable | null {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  return CATALOG.find((item) => item.slug === normalized) ?? null;
}

/** The default selection when checkout is opened without one. */
export const DEFAULT_PURCHASE =
  CATALOG.find((item) => item.featured) ?? CATALOG[0];
