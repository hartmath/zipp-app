import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminSecret } from '@/lib/admin-auth';

export async function POST(req: Request) {
  const auth = validateAdminSecret(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: 401 });

  const { email, password } = await req.json().catch(() => ({} as any));
  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 });
  }

  // Try to create user; if exists, continue
  let userId: string | null = null;
  const createRes = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createRes.error) {
    // If user already exists, find by listing and matching email
    const list = await supabaseAdmin.auth.admin.listUsers();
    const found = list.data.users.find((u: any) => u.email?.toLowerCase() === String(email).toLowerCase());
    if (!found) {
      return NextResponse.json({ error: createRes.error.message }, { status: 400 });
    }
    userId = found.id;
  } else {
    userId = createRes.data.user?.id || null;
  }

  if (!userId) return NextResponse.json({ error: 'Failed to resolve user id' }, { status: 500 });

  // Ensure profile exists and set is_admin=true
  const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (existing) {
    await supabaseAdmin.from('profiles').update({ is_admin: true }).eq('id', userId);
  } else {
    await supabaseAdmin.from('profiles').insert({ id: userId, is_admin: true });
  }

  return NextResponse.json({ success: true, user_id: userId });
}
