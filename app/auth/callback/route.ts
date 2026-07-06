import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // If next is specified in query, redirect there, otherwise default to dashboard
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      
      // Exchange validation code for active user session cookies
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Check if there is a forwarded host (typical in reverse proxy / load balancer on platforms like Vercel)
        const forwardedHost = request.headers.get("x-forwarded-host");
        if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error("Auth exchange session error:", error);
      }
    } catch (err) {
      console.error("Unexpected error in auth callback route:", err);
    }
  }

  // If validation fails, redirect to login page with an error parameter
  return NextResponse.redirect(`${origin}/login?error=email-verification-failed`);
}
