/**
 * Short human-readable payment references, e.g. "AWAY-K7P2QM".
 *
 * A bank transfer arrives with nothing but an amount and whatever the sender
 * typed in the description, so the buyer is asked to quote this reference —
 * it's what ties the money landing in the account to the order on the site.
 */

/** Crockford-style: no 0/O/1/I, so a reference can't be mis-typed from a screen. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const LENGTH = 6;

export const ORDER_REFERENCE_PATTERN = /^AWAY-[2-9A-HJ-NP-Z]{6}$/;

export function generateOrderReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(LENGTH));
  const body = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return `AWAY-${body}`;
}

export function isValidOrderReference(reference: string): boolean {
  return ORDER_REFERENCE_PATTERN.test(reference);
}
