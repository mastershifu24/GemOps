import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project")) {
    return null;
  }

  return createBrowserClient<Database>(url, key);
}

export function isSupabaseConfigured(): boolean {
  return createClient() !== null;
}
