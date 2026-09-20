import { z } from "zod";
import { ORDER_REFERENCE_PATTERN } from "@/lib/order-reference";

/**
 * The optional extreme-Windows upgrade, as it arrives from two different
 * transports: a real boolean in a JSON body, a string in a FormData field.
 *
 * NOT z.coerce.boolean() — that follows JavaScript truthiness, so the
 * string "false" coerces to true and every form that explicitly said no
 * would be charged for the upgrade.
 */
export const extremeFlag = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on"), z.literal("")])
  .optional()
  .transform((value) => value === true || value === "true" || value === "on");

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  discord: z.string().trim().min(2, "Enter your Discord username").max(100),
  specs: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a bit more about what you need").max(2000),
  company: z.string().optional().or(z.literal("")),
  startedAt: z.coerce.number(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/**
 * Checkout payloads. Note what is *absent*: no price and no currency. The
 * browser names a package and (optionally) a discount code; the server looks
 * up what that costs.
 */
export const createOrderSchema = z.object({
  tier: z.string().trim().min(1, "Choose a package").max(64),
  code: z.string().trim().max(40).optional().or(z.literal("")),
  extreme: extremeFlag,
});

export const captureOrderSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  /** Contact handle only — used in the owner's notification email. */
  discord: z.string().trim().max(100).optional().or(z.literal("")),
});

/**
 * Stripe hosted Checkout. Same rule as the PayPal path: a slug and an optional
 * code go up, the server decides what that costs. The Discord handle rides
 * along here (rather than being collected after payment) because the buyer
 * leaves the site for Stripe's page and may never come back to it.
 */
export const createStripeSessionSchema = z.object({
  tier: z.string().trim().min(1, "Choose a package").max(64),
  code: z.string().trim().max(40).optional().or(z.literal("")),
  discord: z.string().trim().max(100).optional().or(z.literal("")),
});

/**
 * Crypto invoice. Email and Discord are REQUIRED here, unlike the Stripe
 * schema where Stripe collects the email on its own page — NOWPayments
 * collects nothing, and a confirmed payment with no way to contact the buyer
 * is an order that can't be delivered.
 */
export const cryptoInvoiceSchema = z.object({
  tier: z.string().trim().min(1, "Choose a package").max(64),
  code: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.email("Enter a valid email").max(200),
  discord: z.string().trim().min(2, "Enter your Discord username").max(100),
  reference: z.string().trim().regex(ORDER_REFERENCE_PATTERN, "Invalid payment reference"),
});

export type CryptoInvoiceValues = z.infer<typeof cryptoInvoiceSchema>;

export type CreateOrderValues = z.infer<typeof createOrderSchema>;
export type CaptureOrderValues = z.infer<typeof captureOrderSchema>;
export type CreateStripeSessionValues = z.infer<typeof createStripeSessionSchema>;

/**
 * Bank transfer order. Like the contact form this is an unauthenticated
 * endpoint that sends mail, so it carries the same honeypot + minimum
 * fill-time defences.
 */
export const bankTransferSchema = z.object({
  tier: z.string().trim().min(1, "Choose a package").max(64),
  code: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.email("Enter a valid email").max(200),
  discord: z.string().trim().min(2, "Enter your Discord username").max(100),
  reference: z.string().trim().regex(ORDER_REFERENCE_PATTERN, "Invalid payment reference"),
  company: z.string().optional().or(z.literal("")),
  startedAt: z.coerce.number(),
});

export type BankTransferValues = z.infer<typeof bankTransferSchema>;

/**
 * An order that will be paid and confirmed in a Discord ticket — bank
 * transfer or crypto. One schema for both: the only difference is which
 * details the panel shows above the form.
 *
 * No email requirement, unlike the bank form this replaced. The ticket is
 * where the buyer is reached, and a required field standing between them and
 * the handoff costs orders for a channel we don't actually need.
 *
 * Honeypot but no minimum fill time: the timer cost real orders on the old
 * form (autofill trips it) and this endpoint's only effect is one email and a
 * pending row, neither of which is worth losing a sale over.
 */
export const ticketOrderSchema = z.object({
  method: z.enum(["bank-transfer", "crypto"]),
  tier: z.string().trim().min(1, "Choose a package").max(64),
  code: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.union([z.email(), z.literal("")]).optional(),
  discord: z.string().trim().min(2, "Enter your Discord username").max(100),
  reference: z.string().trim().regex(ORDER_REFERENCE_PATTERN, "Invalid payment reference"),
  extreme: extremeFlag,
  company: z.string().optional().or(z.literal("")),
});

export type TicketOrderValues = z.infer<typeof ticketOrderSchema>;
