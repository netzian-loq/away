import { EXTREME_UPGRADE, PRICING_TIERS, type PricingTier } from "./pricing";
import { SERVICES, type ServiceCategory } from "./services";

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
  /** Which half of the service list this belongs to; bundles have none. */
  category?: ServiceCategory;
  /** Short badge, e.g. "XOC". */
  tag?: string;
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
      category: service.category,
      ...(service.tag ? { tag: service.tag } : {}),
    }),
  ),
];

export const BUNDLES = CATALOG.filter((item) => item.kind === "bundle");
export const SINGLE_SERVICES = CATALOG.filter((item) => item.kind === "service");

/** Single services in one category, in the order they are sold. */
export function servicesInCategory(category: ServiceCategory): Purchasable[] {
  return SINGLE_SERVICES.filter((item) => item.category === category);
}

/**
 * Whether the extreme Windows upgrade can be added to this item.
 *
 * Packages only. Every package includes the standard Windows tune, so the
 * upgrade has something to upgrade; a single service is bought as the extreme
 * version directly and offering the add-on there would sell it twice.
 */
export function supportsExtreme(item: Purchasable): boolean {
  return item.kind === "bundle";
}

/**
 * The price of an item with or without the upgrade. Every payment path calls
 * this rather than reading `item.price`, so a request that asks for the
 * upgrade is charged for it — and one that asks for it on something that
 * can't take it is charged the plain price rather than refused.
 */
export function priceFor(item: Purchasable, extreme = false): number {
  return extreme && supportsExtreme(item) ? item.price + EXTREME_UPGRADE.price : item.price;
}

/** Server-side price lookup — the browser only ever sends a slug. */
export function findPurchasable(slug: string | null | undefined): Purchasable | null {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  return CATALOG.find((item) => item.slug === normalized) ?? null;
}

/** The default selection when checkout is opened without one. */
export const DEFAULT_PURCHASE = CATALOG.find((item) => item.featured) ?? CATALOG[0];

/**
 * What a package's contents would cost bought one by one, or null when any
 * line in it has no single service behind it.
 *
 * Derived from the feature list by title rather than stored as a number, so
 * it cannot go stale: repricing a service reprices every anchor that includes
 * it, in the same edit. Null rather than a partial sum on a miss — a saving
 * that quietly omits a line is worse than no saving shown at all, because it
 * understates the package and the number still looks authoritative.
 */
export function partsTotal(tier: PricingTier): number | null {
  let sum = 0;
  for (const feature of tier.features) {
    const service = SERVICES.find((item) => item.title === feature);
    if (!service) return null;
    sum += service.priceValue;
  }
  return sum;
}

/** What a package saves against its parts. 0 when it saves nothing. */
export function savingOn(tier: PricingTier): number {
  const parts = partsTotal(tier);
  if (parts === null) return 0;
  return Math.max(0, Math.round((parts - tier.price) * 100) / 100);
}

/**
 * Below this, the saving is not worth printing. Standard saves 2€ against
 * its parts, and "Save 2€" on a 38€ package reads as a reason not to bother
 * rather than a reason to buy.
 */
export const MIN_SHOWN_SAVING = 5;
