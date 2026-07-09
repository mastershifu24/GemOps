"use client";

import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function StaffSignOutButton() {
  const router = useRouter();

  if (!isSupabaseConfigured()) return null;

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-xs text-gem-mist/50 underline underline-offset-4 hover:text-gem-mist"
    >
      Sign out
    </button>
  );
}
