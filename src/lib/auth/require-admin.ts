import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Use inside server actions and admin route handlers to ensure the caller has
 * an authenticated Supabase session. Redirects to /login if not.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}
