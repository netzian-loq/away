"use server";

import { contactFormSchema } from "@/lib/validations";
import { sendContactEmail } from "@/lib/email";

export interface ContactActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const MIN_FILL_TIME_MS = 1500;

export async function submitContactForm(
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = contactFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    };
  }

  const { name, discord, specs, message, company, startedAt } = parsed.data;

  if (company) {
    return { status: "success" };
  }

  if (Date.now() - startedAt < MIN_FILL_TIME_MS) {
    return { status: "success" };
  }

  try {
    await sendContactEmail({ name, discord, specs, message });
    return { status: "success" };
  } catch {
    return {
      status: "error",
      message: "Something went wrong sending your message.",
    };
  }
}
