import type { NextRequest } from "next/server";
import { findPurchasable } from "@/content/catalog";
import { CURRENCY } from "@/content/pricing";
import { applyDiscount, findDiscount, formatAmount } from "@/lib/discounts";
import { createPayPalOrder, PayPalApiError, PayPalConfigError } from "@/lib/paypal";
import { createOrderSchema } from "@/lib/validations";

/**
 * Creates a PayPal order for one bundle or single service. The client sends a
 * catalog slug and an optional discount code — never a price. The amount is
 * derived here from CATALOG so a tampered request can't buy an Extreme tune
 * for €1.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const item = findPurchasable(parsed.data.tier);
  if (!item) {
    return Response.json({ error: "Unknown package." }, { status: 400 });
  }

  const discount = findDiscount(parsed.data.code);
  const amount = formatAmount(applyDiscount(item.price, discount));

  try {
    const order = await createPayPalOrder({
      amount,
      currency: CURRENCY,
      description: `Away Tweaks — ${item.name}`,
      referenceId: item.slug,
      customId: discount?.partner ?? "direct",
    });

    return Response.json({
      id: order.id,
      amount,
      currency: CURRENCY,
      discountApplied: Boolean(discount),
    });
  } catch (error) {
    if (error instanceof PayPalConfigError) {
      return Response.json({ error: "Card payments aren't switched on yet." }, { status: 503 });
    }
    console.error("[paypal] create-order failed", error);
    const status = error instanceof PayPalApiError ? 502 : 500;
    return Response.json({ error: "Could not start the PayPal checkout." }, { status });
  }
}
