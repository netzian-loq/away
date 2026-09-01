"use client";

import { useState } from "react";
import { Bitcoin, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Purchasable } from "@/content/catalog";

interface CryptoPanelProps {
  tier: Purchasable;
  /** Fixed-2 total after any discount. Display only — the server re-derives it. */
  amount: string;
  code: string;
  /** Server-generated reference; becomes NOWPayments' order_id. */
  reference: string;
}

/**
 * Crypto payment via a NOWPayments hosted invoice.
 *
 * The contrast with the bank transfer panel is the point: there is no "I've
 * paid" button here and nothing this component reports can mark the order
 * paid. It collects contact details, asks the server for an invoice, and hands
 * the buyer to NOWPayments' page. Confirmation arrives later, out of band, on
 * a signed webhook.
 */
export function CryptoPanel({ tier, amount, code, reference }: CryptoPanelProps) {
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    setBusy(true);

    // The window has to be opened SYNCHRONOUSLY inside the click, before the
    // await — a window.open() that happens after a fetch resolves is no longer
    // attributable to a user gesture and every browser blocks it.
    //
    // Not `window.open(url, "_blank", "noopener")`: passing noopener makes
    // open() return null by spec, and then there is no handle to navigate.
    // Clearing `opener` on the handle achieves the same isolation.
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;

    try {
      const response = await fetch("/api/crypto/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier.slug, code, email, discord, reference }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not start the payment.");
      }

      if (win && !win.closed) win.location.href = data.url as string;
      // Popup blocked despite the gesture (or opened into a closed tab):
      // navigating this tab is better than losing the invoice.
      else window.location.assign(data.url as string);
      setOpened(true);
    } catch (cryptoError) {
      console.error("[crypto] could not start payment", cryptoError);
      win?.close();
      setError(
        cryptoError instanceof Error ? cryptoError.message : "Could not start the payment.",
      );
    } finally {
      setBusy(false);
    }
  }

  const ready = email.trim().length > 3 && discord.trim().length > 1;

  return (
    <div>
      <div className="flex items-start gap-3 rounded-2xl border border-cyan-accent/25 bg-cyan-accent/[0.06] p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-accent" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Confirmed automatically.</span> You&apos;ll
          pay on NOWPayments&apos; page and your order is marked paid the moment the network
          confirms it — nothing to send us, nothing for us to check by hand.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="cx-email"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Email
          </label>
          <Input
            id="cx-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-1.5"
          />
        </div>

        <div>
          <label
            htmlFor="cx-discord"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Discord username
          </label>
          <Input
            id="cx-discord"
            name="discord"
            required
            value={discord}
            onChange={(event) => setDiscord(event.target.value)}
            placeholder="yourname"
            className="mt-1.5"
          />
        </div>

        {/* Collected before the handoff rather than after, because NOWPayments
            asks for neither — without them a confirmed payment arrives with no
            way to reach the buyer. */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          We need these to deliver your {tier.name} tune — the payment page doesn&apos;t ask for
          them.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}

        <Button type="button" onClick={pay} disabled={busy || !ready} className="w-full">
          <Bitcoin className="h-4 w-4" />
          {busy ? "Opening…" : `Pay ${amount}€ with crypto`}
        </Button>

        {opened && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-accent" aria-hidden="true" />
            <span>
              The payment page opened in a new tab. Keep it open until it says the payment is
              confirmed — you can close this one.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
