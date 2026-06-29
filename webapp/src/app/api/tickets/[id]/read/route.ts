import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Verify ticket belongs to user
    const { id } = await params;
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Mark all admin messages in this ticket as read
    await supabaseAdmin
      .from('ticket_messages')
      .update({ read_by_user: true })
      .eq('ticket_id', id)
      .eq('sender_type', 'admin')
      .eq('read_by_user', false);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}