import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ count: 0 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ count: 0 });

  try {
    // Get all ticket IDs belonging to this user
    const { data: tickets } = await supabaseAdmin
      .from('support_tickets')
      .select('id')
      .eq('user_id', user.id);

    if (!tickets || tickets.length === 0) return NextResponse.json({ count: 0 });

    const ticketIds = tickets.map((t: any) => t.id);

    // Count tickets that have at least one unread admin message
    const { data: unreadMessages } = await supabaseAdmin
      .from('ticket_messages')
      .select('ticket_id')
      .in('ticket_id', ticketIds)
      .eq('sender_type', 'admin')
      .eq('read_by_user', false);

    const uniqueTickets = new Set((unreadMessages || []).map((m: any) => m.ticket_id));
    return NextResponse.json({ count: uniqueTickets.size });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}