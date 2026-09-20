"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AlertTriangle, ArrowRight, Check, Loader2, ShieldCheck, Tag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TicketPanel } from "@/components/checkout/ticket-panel";
import { PurchaseSuccess, type PurchaseReceipt } from "@/components/checkout/purchase-success";
import {
  BUNDLES,
  DEFAULT_PURCHASE,
  findPurchasable,
  priceFor,
  servicesInCategory,
  supportsExtreme,
  type Purchasable,
} from "@/content/catalog";
import { CURRENCY, EXTREME_UPGRADE } from "@/content/pricing";
import { SERVICE_CATEGORIES } from "@/content/services";
import { SITE } from "@/content/site";
import { applyDiscount, findDiscount, formatAmount, type Discount } from "@/lib/discounts";
import {
  BASE_CURRENCY,
  chargedNote,
  formatIn,
  formatPrice,
  type DisplayCurrency,
} from "@/lib/money";
import { cn } from "@/lib/utils";

/** Minimal shape of the bits of the PayPal JS SDK we actually call. */
interface PayPalButtonsConfig {
  style?: Record<string, string | number>;
  /**
   * Restricts the instance to one funding source, e.g. "card". Omitted, the
   * SDK renders its usual stack; set to "card" it renders only the black
   * "Debit or Credit Card" button, which is what the Card tab is.
   */
  fundingSource?: string;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}
interface PayPalNamespace {
  Buttons: (config: PayPalButtonsConfig) => {
    /**
     * False when the buyer's country or browser can't use this funding
     * source. render() throws in that case, so it must be asked first —
     * guest card checkout is the one that actually varies by country.
     */
    isEligible?: () => boolean;
    render: (container: HTMLElement) => Promise<void>;
    close?: () => void;
  };
}
declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

type PaymentMethod = "card" | "paypal" | "bank" | "crypto";

interface CheckoutClientProps {
  initialTier: string;
  initialCode: string;
  /** Server-generated payment reference, used by bank transfer and crypto. */
  reference: string;
  /**
   * Whether the PayPal REST credentials are both set — resolved on the
   * server, because the secret half can't be seen from here.
   *
   * One flag drives two tabs: Card and PayPal are the same integration, and
   * the card button is only a funding source of it. Crypto needs no flag any
   * more — it's settled in a Discord ticket, which is always available.
   */
  paypalEnabled: boolean;
  /**
   * Currency to display prices in, resolved from the request on the server.
   * Display only — every amount is charged in euros whatever this says, and
   * the panel prints the euro figure alongside a converted one.
   */
  currency?: DisplayCurrency;
}

export function CheckoutClient({
  initialTier,
  initialCode,
  reference,
  paypalEnabled,
  currency = BASE_CURRENCY,
}: CheckoutClientProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Both halves of the credential, checked in the two places they live: the
  // secret server-side via the prop, the client id here. They can disagree —
  // a half-filled Vercel environment does exactly that — and the failure it
  // causes is ugly (buttons render, then create-order 503s after the click),
  // so neither tab offers a live button unless both are present.
  const payPalReady = paypalEnabled && Boolean(clientId);

  // Card is the default when it's available: it's the only path that takes a
  // plain card without a PayPal account.
  const [method, setMethod] = useState<PaymentMethod>(payPalReady ? "card" : "paypal");
  const [cardEligible, setCardEligible] = useState(true);
  const [extreme, setExtreme] = useState(false);

  const [tier, setTier] = useState<Purchasable>(
    () => findPurchasable(initialTier) ?? DEFAULT_PURCHASE,
  );
  const [discord, setDiscord] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PurchaseReceipt | null>(null);

  // Partner discounts arrive in the URL and nowhere else. There is no code
  // box: one would advertise the existence of a discount to every visitor
  // (and its placeholder used to spell the code out), letting anyone who
  // arrived through the front door claim a partner's rate. Reaching this page
  // with `?code=` means following the link the partner shared.
  const discount = findDiscount(initialCode);

  // The upgrade is a package-only option, so it is cleared whenever the
  // selection moves to something that cannot take it — otherwise a buyer who
  // ticks it on Pro Level and then switches to a single service carries an
  // invisible flag the server would ignore anyway, and the panel would show
  // a total nobody is charged.
  const upgraded = extreme && supportsExtreme(tier);
  const listPrice = priceFor(tier, upgraded);
  const total = applyDiscount(listPrice, discount);
  const saving = Math.round((listPrice - total) * 100) / 100;

  // PayPal's Buttons are rendered once and are expensive to tear down, so the
  // live selection is mirrored into a ref that createOrder reads at click
  // time — that way changing package never needs a re-render.
  const orderRef = useRef({
    tier: tier.slug,
    code: discount?.code ?? "",
    discord,
    extreme: upgraded,
  });
  useEffect(() => {
    orderRef.current = {
      tier: tier.slug,
      code: discount?.code ?? "",
      discord,
      extreme: upgraded,
    };
  }, [tier, discount, discord, upgraded]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Re-runs when the buyer switches payment method: the container unmounts
  // with the bank panel, so the instance is closed and rebuilt rather than
  // left pointing at a detached node.
  //
  // Card and PayPal share this one effect because they are one integration.
  // The only difference is `fundingSource`, which is what turns the button
  // stack into the single black card button — and with it, the buyer never
  // sees a PayPal login: they land straight on PayPal's hosted card form,
  // pay as a guest, and come back. That is the whole reason this replaced
  // Stripe rather than a second processor being added beside it.
  useEffect(() => {
    if (method !== "paypal" && method !== "card") return;
    if (!payPalReady || !sdkReady || !window.paypal || !containerRef.current) return;

    const card = method === "card";

    const buttons = window.paypal.Buttons({
      ...(card ? { fundingSource: "card" } : {}),
      style: card
        ? { layout: "vertical", color: "black", shape: "pill", label: "pay", height: 48 }
        : { layout: "vertical", color: "gold", shape: "pill", label: "paypal", height: 48 },

      createOrder: async () => {
          setError(null);
          const response = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tier: orderRef.current.tier,
              code: orderRef.current.code,
              extreme: orderRef.current.extreme,
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Could not start the checkout.");
          return data.id as string;
        },

        onApprove: async (data) => {
          setBusy(true);
          try {
            const response = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderID,
                discord: orderRef.current.discord,
              }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? "Could not confirm the payment.");
            setReceipt({
              orderId: result.orderId,
              tierName: result.tierName,
              buyerEmail: result.buyerEmail,
            });
          } catch (captureError) {
            setError(
              captureError instanceof Error
                ? captureError.message
                : "Could not confirm the payment.",
            );
          } finally {
            setBusy(false);
          }
        },

        onCancel: () => setError(null),

        onError: (paypalError: unknown) => {
          console.error("[paypal] buttons error", paypalError);
          setError("PayPal couldn't complete that. Please try again, or open a ticket on Discord.");
        },
    });

    // Guest card checkout isn't offered in every country. Asking first turns
    // "the panel is empty and the console has a throw in it" into a sentence
    // that tells the buyer to use the tab next door, which takes cards too.
    if (buttons.isEligible && !buttons.isEligible()) {
      setCardEligible(!card);
      return;
    }
    setCardEligible(true);

    buttons.render(containerRef.current).catch((renderError) => {
      console.error("[paypal] buttons render failed", renderError);
      setError("PayPal's checkout failed to load.");
    });

    return () => {
      try {
        buttons.close?.();
      } catch {
        // Already torn down by PayPal — nothing to clean up.
      }
    };
  }, [sdkReady, method, payPalReady]);

  if (receipt) {
    return <PurchaseSuccess receipt={receipt} />;
  }

  return (
    <>
      {/* `enable-funding=card` is what makes the Card tab possible — without
          it the SDK won't hand out a card-only button. Pay Later and Venmo are
          disabled instead of left to the defaults: Venmo is US-only and Pay
          Later would let someone finance a €35 tune, which is not a checkout
          this business wants to offer. */}
      {payPalReady && clientId && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${CURRENCY}&intent=capture&components=buttons&enable-funding=card&disable-funding=paylater,venmo`}
          strategy="afterInteractive"
          onReady={() => setSdkReady(true)}
          onError={() => setError("PayPal's checkout failed to load.")}
        />
      )}

      {/* `minmax(0,1fr)` and `min-w-0`, not `1fr` and nothing.
          ------------------------------------------------------------------
          Grid items floor at `min-width: auto` — their min-content size — and
          each package button holds a `truncate`d blurb, which is
          `white-space: nowrap`, so its min-content is the *entire* sentence.
          The longest one is about 1080px wide, which is what the column
          inflated to: at any viewport narrower than that the panel laid out
          past the right edge and `body { overflow-x: hidden }` quietly clipped
          it, so the price, the total and the pay button were cut off with no
          way to scroll to them. Letting the tracks shrink below min-content is
          what lets the truncation do its job instead of dictating the layout. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">1. Choose what you want</h2>

          <Group
            heading="Bundles"
            note="Stack services and pay less."
            items={BUNDLES}
            selectedSlug={tier.slug}
            onSelect={setTier}
            discount={discount}
            currency={currency}
          />
          {/* Split by category rather than listed as one block of nine.
              Someone who wants an overclock and someone who wants a clean
              Windows are not browsing the same list, and a single run of
              nine near-identically shaped rows makes both of them read all
              nine to find the one. */}
          {SERVICE_CATEGORIES.map((category) => (
            <Group
              key={category.id}
              heading={category.label}
              note={category.note}
              items={servicesInCategory(category.id)}
              selectedSlug={tier.slug}
              onSelect={setTier}
              discount={discount}
              currency={currency}
            />
          ))}
        </div>

        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <div className="glass-strong rounded-3xl border border-white/10 p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">2. Pay</h2>

            {/* Shown only to visitors who followed a partner link. Everyone
                else sees no mention of a discount at all. */}
            {discount && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-cyan-accent/30 bg-cyan-accent/[0.07] p-3">
                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-cyan-accent" aria-hidden="true" />
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold text-cyan-accent">
                    {discount.partnerLabel} — {discount.percentOff}% off applied
                  </div>
                  <div className="mt-0.5 text-muted-foreground">
                    Your partner discount is already on this order.
                  </div>
                </div>
              </div>
            )}

            {(method === "card" || method === "paypal") && (
              <>
                <label
                  htmlFor="checkout-discord"
                  className="mt-5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Discord username <span className="normal-case">(so we can find you)</span>
                </label>
                <input
                  id="checkout-discord"
                  value={discord}
                  onChange={(event) => setDiscord(event.target.value)}
                  placeholder="yourname"
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm outline-none transition-colors focus:border-electric/60"
                />
              </>
            )}

            {/* Packages only — a single service is already sold in an
                extreme version, so the upgrade has nothing to upgrade. */}
            {supportsExtreme(tier) && (
              <button
                type="button"
                role="switch"
                aria-checked={extreme}
                onClick={() => setExtreme((on) => !on)}
                className={cn(
                  "mt-5 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors duration-300",
                  extreme
                    ? "border-electric/50 bg-electric/[0.08]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    extreme ? "border-electric bg-electric/30" : "border-white/25",
                  )}
                >
                  {extreme && <Check className="h-3 w-3 text-electric" />}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 text-xs font-semibold">
                    Upgrade to {EXTREME_UPGRADE.name}
                    <span className="text-electric">
                      +{formatIn(EXTREME_UPGRADE.price, currency)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {EXTREME_UPGRADE.note}
                  </span>
                </span>
              </button>
            )}

            {/* Every row: `min-w-0 truncate` on the label, `shrink-0` on the
                amount. The number is the thing the buyer is here to read, so
                a long package name gives way to it rather than pushing it out
                of the panel. */}
            <dl className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="min-w-0 truncate text-muted-foreground">{tier.name}</dt>
                <dd className="shrink-0">{formatIn(tier.price, currency)}</dd>
              </div>
              {upgraded && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="min-w-0 truncate text-muted-foreground">
                    {EXTREME_UPGRADE.name}
                  </dt>
                  <dd className="shrink-0">+{formatIn(EXTREME_UPGRADE.price, currency)}</dd>
                </div>
              )}
              {discount && (
                <div className="flex items-center justify-between gap-3 text-cyan-accent">
                  <dt className="min-w-0 truncate">{discount.code}</dt>
                  <dd className="shrink-0">−{formatIn(saving, currency)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 font-display text-lg font-bold">
                <dt>Total</dt>
                <dd className="shrink-0 text-right">
                  <span className="text-gradient">{formatPrice(total, currency)}</span>
                  {/* Never dropped when the displayed currency is not the
                      charged one. Someone reading dollars has to be able to
                      see the euro figure before they pay, not after. */}
                  {chargedNote(total, currency) && (
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {chargedNote(total, currency)}
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {/* Four equal columns, not a wrapping flex row. The row used to
                wrap because each tab floored at `basis-24`, which four of them
                can't satisfy inside a 24rem panel — "Bank" dropped onto a line
                of its own. Equal grid tracks divide whatever width there is
                instead, and the labels are kept to one short word each so they
                still fit on a 320px phone. */}
            <div
              role="tablist"
              aria-label="Payment method"
              className="mt-6 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
            >
              {/* Text only. The tabs leave no room for an icon, and a
                  landmark glyph beside "Bank transfer" was never carrying
                  information the word didn't already. */}
              {/* Crypto is always listed, but until the NOWPayments keys are
                  in place it shows as "soon" rather than vanishing: an
                  announced method people can see coming is worth more than an
                  empty space, and the disabled state is honest about not
                  being able to take a payment yet. */}
              {(
                [
                  { id: "card", label: "Card", enabled: true, soon: !payPalReady },
                  { id: "paypal", label: "PayPal", enabled: true, soon: false },
                  { id: "crypto", label: "Crypto", enabled: true, soon: false },
                  { id: "bank", label: "Bank", enabled: true, soon: false },
                ] as const
              )
                .filter((option) => option.enabled)
                .map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    disabled={option.soon}
                    aria-selected={!option.soon && method === option.id}
                    aria-disabled={option.soon}
                    // Out of the tab sequence while it can't be chosen —
                    // otherwise keyboard users land on a control that does
                    // nothing and have no way to know why.
                    tabIndex={option.soon ? -1 : undefined}
                    title={option.soon ? `${option.label} payments are coming soon` : undefined}
                    onClick={option.soon ? undefined : () => setMethod(option.id)}
                    className={cn(
                      "flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center text-xs font-medium transition-colors duration-300 sm:text-sm",
                      option.soon
                        ? "cursor-not-allowed text-muted-foreground/50"
                        : method === option.id
                          ? "bg-electric/20 text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                    {option.soon && (
                      <span className="hidden rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 sm:inline">
                        Soon
                      </span>
                    )}
                  </button>
                ))}
            </div>

            <div className="mt-5">
              {method === "card" || method === "paypal" ? (
                payPalReady ? (
                  <>
                    <div
                      ref={containerRef}
                      className={cn(busy && "pointer-events-none opacity-60")}
                    />
                    {!sdkReady && (
                      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Loading {method === "card" ? "the card form" : "PayPal"}…
                      </div>
                    )}
                    {busy && (
                      <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Confirming your payment…
                      </div>
                    )}
                    {/* Only reachable on the card tab — the PayPal stack is
                        eligible everywhere the SDK loads at all. */}
                    {!cardEligible && (
                      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-4 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-medium text-amber-300">
                          Card isn&apos;t available in your country.
                        </span>{" "}
                        Use the PayPal tab — it takes the same cards, you just sign in first.
                      </div>
                    )}
                  </>
                ) : method === "card" ? (
                  <CardUnavailable />
                ) : (
                  <ManualPayPalFallback amount={formatAmount(total)} tierName={tier.name} />
                )
              ) : method === "crypto" ? (
                <TicketPanel
                  method="crypto"
                  tier={tier}
                  amount={formatAmount(total)}
                  code={discount?.code ?? ""}
                  reference={reference}
                  extreme={upgraded}
                  defaultDiscord={discord}
                />
              ) : method === "bank" ? (
                <TicketPanel
                  method="bank-transfer"
                  tier={tier}
                  amount={formatAmount(total)}
                  code={discount?.code ?? ""}
                  reference={reference}
                  extreme={upgraded}
                  defaultDiscord={discord}
                />
              ) : null}
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-300">
                {error}
              </p>
            )}

            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-electric" aria-hidden="true" />
              {method === "bank"
                ? "You pay from your own banking app — Away Tweaks never asks for your bank login or card details."
                : method === "card"
                  ? "Your card is entered on PayPal's own secure form — no PayPal account needed, and Away Tweaks never sees your card details."
                  : method === "crypto"
                    ? "You send from your own wallet — Away Tweaks never asks for your keys or your seed phrase."
                    : "Payment is handled entirely by PayPal — Away Tweaks never sees your card details."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Group({
  heading,
  note,
  items,
  selectedSlug,
  onSelect,
  discount,
  currency,
}: {
  heading: string;
  note: string;
  items: Purchasable[];
  selectedSlug: string;
  onSelect: (item: Purchasable) => void;
  discount: Discount | null;
  currency: DisplayCurrency;
}) {
  return (
    <div className="mt-7 first:mt-5">
      <div className="flex items-baseline gap-3">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-electric">
          {heading}
        </h3>
        <span className="text-xs text-muted-foreground">{note}</span>
      </div>

      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const selected = item.slug === selectedSlug;
          const total = applyDiscount(item.price, discount);
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => onSelect(item)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all duration-300",
                selected
                  ? "glass-strong border-electric/50 shadow-glow"
                  : "glass border-white/5 hover:border-white/15",
              )}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-display font-semibold">{item.name}</span>
                  {item.featured && (
                    <span className="rounded-full bg-electric/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-electric">
                      Popular
                    </span>
                  )}
                </span>
                <span className="mt-1 block truncate text-sm text-muted-foreground">
                  {item.blurb}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {discount && (
                  <span className="block text-xs text-muted-foreground line-through">
                    {formatIn(item.price, currency)}
                  </span>
                )}
                <span className="font-display text-xl font-bold text-gradient">
                  {formatIn(total, currency)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Shown until the PayPal API credentials are configured: a PayPal.Me link for
 * the exact amount, so the site can still take money today. No automatic
 * receipt on this path — the buyer is told to open a ticket instead.
 *
 * The Friends & Family instruction lives here and only here: the automated
 * Orders API can only create goods-and-services payments, so on that path the
 * buyer has no such choice to make.
 */
function ManualPayPalFallback({ amount, tierName }: { amount: string; tierName: string }) {
  const href = `https://paypal.me/${SITE.paypalMeHandle}/${amount}${CURRENCY}`;
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
      <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-3 text-left">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Send as Friends &amp; Family
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Choose <span className="text-foreground/90">Friends &amp; Family</span>{" "}
          when you send the payment. Anything sent as Goods &amp; Services will be refunded and your
          order won&apos;t be started.
        </p>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants(), "w-full px-4 sm:px-6")}
      >
        Pay {amount}€ with PayPal <ArrowRight className="h-4 w-4 shrink-0" />
      </a>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        You&apos;ll pay <span className="text-foreground/90">@{SITE.paypalMeHandle}</span> for the{" "}
        {tierName} package. After paying,{" "}
        <a
          href={SITE.discordSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-electric hover:underline"
        >
          open a ticket on Discord
        </a>{" "}
        with your receipt and we&apos;ll book your session.
      </p>
    </div>
  );
}


/**
 * Defensive only. The Card tab is disabled while the PayPal credentials are
 * missing, so this is what's left if the tab is somehow reached anyway —
 * better than an empty panel with a silent console error.
 */
function CardUnavailable() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center text-xs leading-relaxed text-muted-foreground">
      <AlertTriangle className="mx-auto h-4 w-4 text-amber-300" aria-hidden="true" />
      <p className="mt-2">
        Card payments aren&apos;t switched on yet. Pick PayPal, crypto or a bank transfer — all
        three work right now.
      </p>
    </div>
  );
}
