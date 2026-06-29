import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return { error: 'No authorization header', user: null };

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return { error: 'Invalid token', user: null };

  const adminUsernames = (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || 'admin').split(',').map(u => u.trim().toLowerCase());
  const username = (user.user_metadata?.username || '').toLowerCase();
  if (!adminUsernames.includes(username)) return { error: 'Unauthorized', user };

  return { error: null, user };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

  try {
    const { content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('ticket_messages')
      .insert({ ticket_id: id, sender_type: 'admin', content: content.trim() })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}