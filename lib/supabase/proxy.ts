import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Jika environment variable belum tersedia,
  // jangan jalankan pemeriksaan login.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Buat Supabase server client baru untuk setiap request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Jangan menambahkan kode di antara createServerClient
  // dan supabase.auth.getClaims().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  // Halaman autentikasi tetap boleh dibuka tanpa login.
  const isAuthPage = pathname.startsWith("/auth");

  // Jika belum login dan mencoba membuka halaman aplikasi,
  // arahkan ke halaman login.
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();

    url.pathname = "/auth/login";

    return NextResponse.redirect(url);
  }

  // Jika sudah login, lanjutkan request seperti biasa.
  return supabaseResponse;
}