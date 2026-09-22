"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { checkoutHrefFor } from "@/lib/discounts";

/**
 * A link to checkout that keeps a partner's code attached on their page.
 *
 * The site chrome (the nav's "Get Optimized", the footer's "Buy") used to
 * point at a bare /checkout everywhere. On a partner page that silently lost
 * the sale: a viewer who clicked the nav instead of the page's own button
 * paid full price, and the partner was never credited. Resolved from the
 * path rather than passed down, because the nav and footer are rendered by
 * the layout and do not know which page they are sitting on.
 */
export function CheckoutLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();
  return <Link {...props} href={checkoutHrefFor(pathname)} />;
}
