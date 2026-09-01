import { cookies } from "next/headers";

/** Reads the visitor session id set by the client-side page-view tracker, if present. */
export async function currentSessionId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get("rp_sid")?.value;
}
