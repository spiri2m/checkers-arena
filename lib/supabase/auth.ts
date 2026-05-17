import { getSupabaseClient } from "@/lib/supabase/client";

export async function hasSupabaseSession(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}
