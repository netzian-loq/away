import type { NextRequest } from "next/server";
import { findPartner } from "@/lib/discounts";
import { recordVisit } from "@/lib/visits/store";

/**
 * Records a visit to a partner page.
 *
 * A route handler rather than counting in the page's server component, because
 * a server component re-renders on prefetch, on back-navigation and on every
 * revalidation — none of which is a person arriving. A beacon fired once per
 * browser session from the client is a much closer match to "someone opened
 * this page".
 *
 * The partner slug is validated against the discount table, so this cannot be
 * used to write arbitrary rows by POSTing invented names at it.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const partner = typeof body?.partner === "string" ? body.partner.trim().toLowerCase() : "";

  if (!partner || !findPartner(partner)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Host only, never the full URL: a referring path can carry a search query
  // or a private link, and the host is all that is needed to tell Discord from
  // Twitter from direct.
  let referrerHost: string | null = null;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      referrerHost = url.host === request.nextUrl.host ? null : url.host;
    } catch {
      referrerHost = null;
    }
  }

  await recordVisit(partner, referrerHost);
  return Response.json({ ok: true });
}
