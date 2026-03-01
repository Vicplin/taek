import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();
  const origin = requestUrl.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  if (data.url) {
    return NextResponse.redirect(data.url);
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
