import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";
import type { SupabaseClient, User } from "@supabase/supabase-js";

async function createStaffRouteClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: object }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route handler may be read-only in some contexts
          }
        },
      },
    }
  );
}

export function createServiceClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes("your-project")) {
    return null;
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type StaffSessionResult =
  | { user: User; db: SupabaseClient<Database> }
  | { response: NextResponse };

/** Verify staff login, then return a server DB client for privileged routes. */
export async function requireStaffSession(): Promise<StaffSessionResult> {
  const authClient = await createStaffRouteClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const db = createServiceClient();
  if (!db) {
    return {
      response: NextResponse.json(
        {
          error:
            "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY required for staff API",
        },
        { status: 503 }
      ),
    };
  }

  return { user, db };
}

export function requireServiceClient():
  | SupabaseClient<Database>
  | NextResponse {
  const client = createServiceClient();
  if (!client) {
    return NextResponse.json(
      {
        error:
          "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY required for order creation",
      },
      { status: 503 }
    );
  }
  return client;
}
