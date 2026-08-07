"use client";

import { useActionState, type RefObject } from "react";
import { ArrowRight, Check, Copy, Landmark } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitBankTransferOrder, type BankTransferState } from "@/actions/bank-transfer";
import { CURRENCY, type PricingTier } from "@/content/pricing";
import { SITE } from "@/content/site";
import { PURCHASE_THANK_YOU } from "@/lib/email-copy";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

const initialState: BankTransferState = { status: "idle" };

interface BankTransferProps {
  tier: PricingTier;
  /** Fixed-2 total after any discount. */
  amount: string;
  code: string;
  /** Server-generated reference the buyer quotes on the transfer. */
  reference: string;
  /**
   * When the buyer arrived at checkout, owned by the parent.
   *
   * It must NOT be measured from this panel's mount: the panel only mounts
   * when the bank tab is picked, so someone who switches tab and types fast
   * would trip the server's minimum-fill-time bot check and get a silent
   * fake success with no order recorded.
   */
  startedAtRef: RefObject<number>;
}

export function BankTransfer({
  tier,
  amount,
  code,
  reference,
  startedAtRef,
}: BankTransferProps) {
  const [state, formAction, pending] = useActionState(submitBankTransferOrder, initialState);

  const handleAction = (formData: FormData) => {
    formData.set("startedAt", String(startedAtRef.current || Date.now()));
    return formAction(formData);
  };

  if (state.status === "success") {
    return <BankTransferReceipt state={state} amount={amount} reference={reference} />;
  }

  return (
    <div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <CopyRow label="Amount" value={`${amount} ${CURRENCY}`} copyValue={amount} />
        <CopyRow label="Account holder" value={SITE.bank.accountHolder} />
        <CopyRow label="IBAN" value={SITE.bank.iban} mono />
        <CopyRow label="Reference" value={reference} mono highlight />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Put the reference <span className="font-mono text-cyan-accent">{reference}</span> in the
        transfer description — it&apos;s how we match your payment to your order.
      </p>

      <form action={handleAction} className="mt-5 space-y-3">
        <input type="hidden" name="tier" value={tier.slug} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="reference" value={reference} />
        <div className="hidden">
          <label htmlFor="bt-company">Company</label>
          <input id="bt-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label
            htmlFor="bt-email"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Email
          </label>
          <Input
            id="bt-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="bt-discord"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Discord username
          </label>
          <Input
            id="bt-discord"
            name="discord"
            required
            placeholder="yourname"
            className="mt-1.5"
          />
        </div>

        {state.status === "error" && (
          <p role="alert" className="text-sm text-red-300">
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          <Landmark className="h-4 w-4" />
          {pending ? "Sending…" : "I've sent the transfer"}
        </Button>
      </form>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Transfers usually arrive within one business day. We start once it lands.
      </p>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copyValue,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  copyValue?: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  const { copy, isCopied } = useCopyToClipboard();
  const target = copyValue ?? value;
  const copied = isCopied(target);

  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => copy(target)}
        aria-label={`Copy ${label}`}
        className="group -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
      >
        {/* break-all, never truncate: an IBAN the buyer can't fully read is
            useless on a payment page, and 27 characters won't fit the sidebar
            on a phone. */}
        <span
          className={cn(
            "min-w-0 break-all text-sm",
            mono && "font-mono tracking-wide",
            highlight ? "text-cyan-accent" : "text-foreground",
          )}
        >
          {value}
        </span>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-cyan-accent" aria-hidden="true" />
        ) : (
          <Copy
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-cyan-accent"
            aria-hidden="true"
          />
        )}
        <span className="sr-only" aria-live="polite">
          {copied ? "Copied!" : ""}
        </span>
      </button>
    </div>
  );
}

/**
 * On-screen receipt. This carries the thank-you copy itself rather than
 * relying on the email, so the buyer always sees it — the emailed copy needs a
 * verified sending domain, this doesn't.
 */
function BankTransferReceipt({
  state,
  amount,
  reference,
}: {
  state: BankTransferState;
  amount: string;
  reference: string;
}) {
  return (
    <div className="rounded-2xl border border-electric/30 bg-white/[0.02] p-6 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-electric/15 text-electric">
        <Check className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-gradient">Order recorded</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {PURCHASE_THANK_YOU}.
      </p>
      <a
        href={SITE.discordSupportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ className: "mt-5 w-full" })}
      >
        Open a ticket <ArrowRight className="h-4 w-4" />
      </a>
      <dl className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-left text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Send</dt>
          <dd className="font-mono">
            {state.amount ?? amount} {CURRENCY}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">To</dt>
          <dd className="truncate font-mono">{SITE.bank.iban}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="font-mono text-cyan-accent">{state.reference ?? reference}</dd>
        </div>
      </dl>
    </div>
  );
}
