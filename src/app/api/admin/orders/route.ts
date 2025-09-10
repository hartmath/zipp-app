import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminSecret } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = validateAdminSecret(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: 401 });
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const auth = validateAdminSecret(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: 401 });
  const body = await req.json();
  const { id, updates } = body || {};
  if (!id || !updates) return NextResponse.json({ error: 'id and updates required' }, { status: 400 });
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('orders').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
