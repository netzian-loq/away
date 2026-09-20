"use client";

import { useActionState } from "react";
import { ArrowRight, Check, Copy, Landmark, Ticket } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  submitTicketOrder,
  type TicketMethod,
  type TicketOrderState,
} from "@/actions/ticket-order";
import { type Purchasable } from "@/content/catalog";
import { CURRENCY } from "@/content/pricing";
import { SITE } from "@/content/site";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

const initialState: TicketOrderState = { status: "idle" };

interface TicketPanelProps {
  method: TicketMethod;
  tier: Purchasable;
  /** Fixed-2 total after any discount. Display only — the server re-derives it. */
  amount: string;
  code: string;
  /** Server-generated reference the buyer quotes in the ticket. */
  reference: string;
  /** Whether the extreme Windows upgrade was ticked. Re-checked server-side. */
  extreme?: boolean;
  /**
   * Handle already typed on the PayPal tab, if any. Seeded rather than
   * controlled: this form owns the field once mounted, and the point is only
   * that switching tab does not silently throw away what was typed.
   */
  defaultDiscord?: string;
}

/**
 * The two payment methods a person settles by hand: bank transfer and crypto.
 *
 * Both used to end in a button the buyer pressed to assert they had paid —
 * "I've sent the transfer" on one, a hosted invoice that never got its API
 * keys on the other. The first was worth nothing (anyone could click it
 * without sending a cent, and the order landed looking exactly like a real
 * one) and the second took no money at all. Both now register the order and
 * hand over to a Discord ticket, where a person confirms the money.
 *
 * What is deliberately NOT here: any control that claims a payment has been
 * made. The buyer states an intent; the owner states the fact.
 */
export function TicketPanel({
  method,
  tier,
  amount,
  code,
  reference,
  extreme = false,
  defaultDiscord = "",
}: TicketPanelProps) {
  const [state, formAction, pending] = useActionState(submitTicketOrder, initialState);
  const bank = method === "bank-transfer";

  if (state.status === "success") {
    return (
      <TicketHandoff method={method} amount={amount} reference={reference} tierName={tier.name} />
    );
  }

  return (
    <div>
      {bank ? (
        <div className="flex items-start gap-3 rounded-2xl border border-electric/25 bg-electric/[0.06] p-4">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-electric" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Confirmed in a ticket.</span> Tell us
            where to find you and we&apos;ll send you to Discord with the account details and your
            reference — we confirm there as soon as the transfer lands.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-cyan-accent/25 bg-cyan-accent/[0.06] p-4">
          <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-cyan-accent" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Handled in a ticket.</span> Tell us where
            to find you and we&apos;ll send you to Discord, where you get a wallet address for the
            coin you want to pay in — BTC, ETH, SOL, USDT and more.
          </p>
        </div>
      )}

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="method" value={method} />
        <input type="hidden" name="tier" value={tier.slug} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="reference" value={reference} />
        <input type="hidden" name="extreme" value={extreme ? "true" : "false"} />
        <div className="hidden">
          <label htmlFor="tk-company">Company</label>
          <input id="tk-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label
            htmlFor="tk-discord"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Discord username
          </label>
          <Input
            id="tk-discord"
            name="discord"
            required
            defaultValue={defaultDiscord}
            placeholder="yourname"
            className="mt-1.5"
          />
        </div>

        {/* Optional. The ticket is the contact channel, so an email is a
            nice-to-have for the receipt and not worth a required field
            standing between the buyer and their details. */}
        <div>
          <label
            htmlFor="tk-email"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Email <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <Input
            id="tk-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1.5"
          />
        </div>

        {state.status === "error" && state.message && (
          <p role="alert" className="text-sm text-red-300">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          <Ticket className="h-4 w-4" />
          {pending ? "One second…" : `Pay ${amount}€ ${bank ? "by transfer" : "in crypto"}`}
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          No payment is taken here. You&apos;ll get the details in the ticket.
        </p>
      </form>
    </div>
  );
}

/**
 * Shown once the order is registered. The reference is the point of this
 * screen: it is what turns "someone in a ticket" into a specific pending
 * order with a package and a partner attached, so it is shown big and
 * copyable.
 *
 * Every accent class here is written out in full rather than interpolated.
 * Tailwind scans source text for complete class names, so a `text-${accent}`
 * would compile to nothing and silently render grey.
 */
function TicketHandoff({
  method,
  amount,
  reference,
  tierName,
}: {
  method: TicketMethod;
  amount: string;
  reference: string;
  tierName: string;
}) {
  const { copy, isCopied } = useCopyToClipboard();
  const copied = isCopied(reference);
  const crypto = method === "crypto";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 text-center",
        crypto
          ? "border-cyan-accent/25 bg-cyan-accent/[0.06]"
          : "border-electric/25 bg-electric/[0.06]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-10 w-10 items-center justify-center rounded-full",
          crypto ? "bg-cyan-accent/15" : "bg-electric/15",
        )}
      >
        <Check
          className={cn("h-5 w-5", crypto ? "text-cyan-accent" : "text-electric")}
          aria-hidden="true"
        />
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold">You&apos;re booked in</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Your {tierName} order is registered for{" "}
        <span className="text-foreground/90">
          {amount} {CURRENCY}
        </span>
        . Open a ticket and quote the reference below — we&apos;ll send you{" "}
        {crypto
          ? "a wallet address for whichever coin you want to use"
          : "the account details to transfer to"}
        .
      </p>

      <button
        type="button"
        onClick={() => copy(reference)}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/20"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Your reference
          </span>
          <span
            className={cn(
              "block truncate font-mono text-base",
              crypto ? "text-cyan-accent" : "text-electric",
            )}
          >
            {reference}
          </span>
        </span>
        {copied ? (
          <Check
            className={cn("h-4 w-4 shrink-0", crypto ? "text-cyan-accent" : "text-electric")}
            aria-hidden="true"
          />
        ) : (
          <Copy className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <span className="sr-only">Copy the reference</span>
      </button>

      <a
        href={SITE.discordSupportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants(), "mt-4 w-full px-4 sm:px-6")}
      >
        Open a ticket on Discord <ArrowRight className="h-4 w-4 shrink-0" />
      </a>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Your order stays reserved until then — nothing expires.
      </p>
    </div>
  );
}
