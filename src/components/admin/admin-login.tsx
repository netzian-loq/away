"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLogin, type AdminLoginState } from "@/actions/admin";

const initialState: AdminLoginState = { status: "idle" };

export function AdminLogin() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);

  return (
    <form action={formAction} className="glass-strong mx-auto max-w-sm rounded-2xl border border-white/10 p-8">
      <div className="flex items-center gap-2 font-display text-lg font-semibold">
        <Lock className="h-4 w-4 text-electric" aria-hidden="true" />
        Orders dashboard
      </div>

      <label
        htmlFor="admin-password"
        className="mt-6 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Password
      </label>
      <Input
        id="admin-password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="mt-2"
      />

      {state.status === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-5 w-full">
        {pending ? "Checking…" : "Sign in"}
      </Button>
    </form>
  );
}
