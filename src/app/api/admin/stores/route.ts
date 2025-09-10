import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateAdminSecret } from '@/lib/admin-auth';

export async function GET(req: Request) {
  const auth = validateAdminSecret(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('creator_stores').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const auth = validateAdminSecret(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: 401 });
  const body = await req.json();
  const { id, updates } = body || {};
  if (!id || !updates) return NextResponse.json({ error: 'id and updates required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('creator_stores').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
