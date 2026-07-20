import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  discord: z.string().trim().min(2, "Enter your Discord username").max(100),
  specs: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a bit more about what you need").max(2000),
  company: z.string().optional().or(z.literal("")),
  startedAt: z.coerce.number(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
