"use server";

import { revalidatePath } from "next/cache";
import { isSignedIn, signIn, signOut, tokenForPassword } from "@/lib/admin-auth";
import { setOrderStatus } from "@/lib/orders/store";

export interface AdminLoginState {
  status: "idle" | "error";
  message?: string;
}

export async function adminLogin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const password = String(formData.get("password") ?? "");
  const token = tokenForPassword(password);

  if (!token) {
    return { status: "error", message: "Wrong password." };
  }

  await signIn(token);
  revalidatePath("/admin/orders");
  return { status: "idle" };
}

export async function adminLogout(): Promise<void> {
  await signOut();
  revalidatePath("/admin/orders");
}

/**
 * Flips a bank transfer to paid once the money is seen in the account —
 * commission is only counted on paid orders, so this is what makes a
 * partner's balance real.
 */
export async function markOrderPaid(formData: FormData): Promise<void> {
  // Re-checked here, not just in the page: a server action is its own
  // endpoint and is reachable without ever rendering the dashboard.
  if (!(await isSignedIn())) return;

  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "pending" ? "pending" : "paid";
  if (!id) return;

  await setOrderStatus(id, status);
  revalidatePath("/admin/orders");
}
