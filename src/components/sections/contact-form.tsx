"use client";

import { useActionState, useEffect, useRef } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm, type ContactActionState } from "@/actions/contact";

const initialState: ContactActionState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  const handleAction = (formData: FormData) => {
    formData.set("startedAt", String(startedAtRef.current));
    return formAction(formData);
  };

  if (state.status === "success") {
    return (
      <div className="glass rounded-2xl border border-electric/30 p-8 text-center">
        <h3 className="font-display text-xl font-semibold text-gradient">Request sent.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll reply within 24 hours. In the meantime, feel free to join our Discord.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={handleAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Name
        </label>
        <Input id="name" name="name" placeholder="Your name" required className="mt-1.5" />
      </div>

      <div>
        <label htmlFor="discord" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Discord Username
        </label>
        <Input id="discord" name="discord" placeholder="yourtag" required className="mt-1.5" />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="specs" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          PC Specs
        </label>
        <Input id="specs" name="specs" placeholder="CPU / GPU / RAM" className="mt-1.5" />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Message
        </label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Games you play, current issues, goals…"
          className="mt-1.5"
        />
      </div>

      {state.status === "error" && (
        <div className="sm:col-span-2">
          <p className="text-sm text-red-400">
            {state.message} You can also email{" "}
            <a href="mailto:Mattiaarminante77@gmail.com" className="underline">
              Mattiaarminante77@gmail.com
            </a>{" "}
            directly.
          </p>
        </div>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          <Mail className="h-4 w-4" /> {pending ? "Sending…" : "Send Request"}
        </Button>
      </div>
    </form>
  );
}
