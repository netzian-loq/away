"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Landmark, Loader2, ShieldCheck, Tag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BankTransfer } from "@/components/checkout/bank-transfer";
import {
  BUNDLES,
  DEFAULT_PURCHASE,
  findPurchasable,
  SINGLE_SERVICES,
  type Purchasable,
} from "@/content/catalog";
import { CURRENCY } from "@/content/pricing";
import { SITE } from "@/content/site";
import { applyDiscount, findDiscount, formatAmount, type Discount } from "@/lib/discounts";
import { cn } from "@/lib/utils";

/** Minimal shape of the bits of the PayPal JS SDK we actually call. */
interface PayPalButtonsConfig {
  style?: Record<string, string | number>;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}
interface PayPalNamespace {
  Buttons: (config: PayPalButtonsConfig) => {
    render: (container: HTMLElement) => Promise<void>;
    close?: () => void;
  };
}
declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

interface Receipt {
  orderId: string;
  amount: string;
  currency: string;
  tierName: string;
  buyerEmail: string;
}

type PaymentMethod = "paypal" | "bank";

interface CheckoutClientProps {
  initialTier: string;
  initialCode: string;
  /** Server-generated payment reference for the bank transfer path. */
  reference: string;
}

export function CheckoutClient({ initialTier, initialCode, reference }: CheckoutClientProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const [method, setMethod] = useState<PaymentMethod>("paypal");

  const [tier, setTier] = useState<Purchasable>(
    () => findPurchasable(initialTier) ?? DEFAULT_PURCHASE,
  );
  const [discord, setDiscord] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // Partner discounts arrive in the URL and nowhere else. There is no code
  // box: one would advertise the existence of a discount to every visitor
  // (and its placeholder used to spell the code out), letting anyone who
  // arrived through the front door claim a partner's rate. Reaching this page
  // with `?code=` means following the link the partner shared.
  const discount = findDiscount(initialCode);
  const total = applyDiscount(tier.price, discount);
  const saving = Math.round((tier.price - total) * 100) / 100;

  // PayPal's Buttons are rendered once and are expensive to tear down, so the
  // live selection is mirrored into a ref that createOrder reads at click
  // time — that way changing package never needs a re-render.
  const orderRef = useRef({ tier: tier.slug, code: discount?.code ?? "", discord });
  useEffect(() => {
    orderRef.current = { tier: tier.slug, code: discount?.code ?? "", discord };
  }, [tier, discount, discord]);

  // Set on page load, not when the bank panel mounts — see BankTransfer.
  const startedAtRef = useRef(0);
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Re-runs when the buyer switches payment method: the container unmounts
  // with the bank panel, so the instance is closed and rebuilt rather than
  // left pointing at a detached node.
  useEffect(() => {
    if (method !== "paypal" || !sdkReady || !window.paypal || !containerRef.current) return;

    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal", height: 48 },

      createOrder: async () => {
          setError(null);
          const response = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tier: orderRef.current.tier,
              code: orderRef.current.code,
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
            setReceipt(result as Receipt);
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
  }, [sdkReady, method]);

  if (receipt) {
    return <SuccessPanel receipt={receipt} />;
  }

  return (
    <>
      {clientId && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${CURRENCY}&intent=capture&components=buttons`}
          strategy="afterInteractive"
          onReady={() => setSdkReady(true)}
          onError={() => setError("PayPal's checkout failed to load.")}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-10">
        <div>
          <h2 className="font-display text-lg font-semibold">1. Choose what you want</h2>

          <Group
            heading="Bundles"
            note="Stack services and pay less."
            items={BUNDLES}
            selectedSlug={tier.slug}
            onSelect={setTier}
            discount={discount}
          />
          <Group
            heading="Single services"
            note="Just need one thing? Buy it on its own."
            items={SINGLE_SERVICES}
            selectedSlug={tier.slug}
            onSelect={setTier}
            discount={discount}
          />
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass-strong rounded-3xl border border-white/10 p-6">
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

            <label className="mt-5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Discord username <span className="normal-case">(so we can find you)</span>
            </label>
            <input
              value={discord}
              onChange={(event) => setDiscord(event.target.value)}
              placeholder="yourname"
              aria-label="Discord username"
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm outline-none transition-colors focus:border-electric/60"
            />

            <dl className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{tier.name}</dt>
                <dd>{formatAmount(tier.price)}€</dd>
              </div>
              {discount && (
                <div className="flex items-center justify-between text-cyan-accent">
                  <dt>{discount.code}</dt>
                  <dd>−{formatAmount(saving)}€</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-white/10 pt-3 font-display text-lg font-bold">
                <dt>Total</dt>
                <dd className="text-gradient">{formatAmount(total)}€</dd>
              </div>
            </dl>

            <div
              role="tablist"
              aria-label="Payment method"
              className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
            >
              {(
                [
                  { id: "paypal", label: "PayPal" },
                  { id: "bank", label: "Bank transfer" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={method === option.id}
                  onClick={() => setMethod(option.id)}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
                    method === option.id
                      ? "bg-electric/20 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.id === "bank" && (
                    <Landmark className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {method === "bank" ? (
                <BankTransfer
                  tier={tier}
                  amount={formatAmount(total)}
                  code={discount?.code ?? ""}
                  reference={reference}
                  startedAtRef={startedAtRef}
                />
              ) : clientId ? (
                <>
                  <div ref={containerRef} className={cn(busy && "pointer-events-none opacity-60")} />
                  {!sdkReady && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Loading PayPal…
                    </div>
                  )}
                  {busy && (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Confirming your payment…
                    </div>
                  )}
                </>
              ) : (
                <ManualPayPalFallback amount={formatAmount(total)} tierName={tier.name} />
              )}
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
}: {
  heading: string;
  note: string;
  items: Purchasable[];
  selectedSlug: string;
  onSelect: (item: Purchasable) => void;
  discount: Discount | null;
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
                    {item.price}€
                  </span>
                )}
                <span className="font-display text-xl font-bold text-gradient">
                  {formatAmount(total)}€
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
        className={buttonVariants({ className: "w-full" })}
      >
        Pay {amount}€ with PayPal <ArrowRight className="h-4 w-4" />
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

function SuccessPanel({ receipt }: { receipt: Receipt }) {
  return (
    <div className="glass-strong mx-auto max-w-xl rounded-3xl border border-electric/30 p-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-electric/15 text-electric">
        <Check className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-6 font-display text-2xl font-bold text-gradient">Payment received</h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Thanks for purchasing the <span className="text-foreground">{receipt.tierName}</span>{" "}
        package. A receipt is on its way
        {receipt.buyerEmail ? ` to ${receipt.buyerEmail}` : ""}.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Next step: open a ticket on our Discord and we&apos;ll get your session booked.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={SITE.discordSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "lg" })}
        >
          Open a ticket <ArrowRight className="h-4 w-4" />
        </a>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back to site
        </Link>
      </div>
      <p className="mt-6 font-mono text-xs text-muted-foreground">Order {receipt.orderId}</p>
    </div>
  );
}
