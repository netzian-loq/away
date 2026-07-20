import { Resend } from "resend";

export interface ContactEmailInput {
  name: string;
  discord: string;
  specs?: string;
  message: string;
}

export async function sendContactEmail(input: ContactEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, discord, specs, message } = input;
  const result = await resend.emails.send({
    from: "Away Tweaks Website <onboarding@resend.dev>",
    to: "Mattiaarminante77@gmail.com",
    subject: `Away Tweaks Request — ${name}`,
    text: `Name: ${name}\nDiscord: ${discord}\nPC Specs: ${specs || "—"}\n\nMessage:\n${message}`,
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result;
}
