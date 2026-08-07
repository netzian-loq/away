import { z } from "zod";
import { ORDER_REFERENCE_PATTERN } from "@/lib/order-reference";

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
});

export const captureOrderSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  /** Contact handle only — used in the owner's notification email. */
  discord: z.string().trim().max(100).optional().or(z.literal("")),
});

export type CreateOrderValues = z.infer<typeof createOrderSchema>;
export type CaptureOrderValues = z.infer<typeof captureOrderSchema>;

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
