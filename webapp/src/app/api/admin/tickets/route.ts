import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return { error: 'No authorization header', user: null };

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return { error: `Invalid token: ${error?.message || 'No user'}`, user: null };

  const adminUsernames = (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || 'admin').split(',').map(u => u.trim().toLowerCase());
  const username = (user.user_metadata?.username || '').toLowerCase();

  if (!adminUsernames.includes(username)) {
    return { error: `Unauthorized: User '${username}' is not an admin. Allowed: ${adminUsernames.join(',')}`, user };
  }

  return { error: null, user };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

  try {
    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch user details for each ticket
    const uniqueUserIds = Array.from(new Set(tickets.map(t => t.user_id)));
    const usersData: Record<string, any> = {};

    await Promise.all(uniqueUserIds.map(async (uid) => {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
      if (user) {
        usersData[uid] = {
          username: user.user_metadata?.username || 'Unknown',
          email: user.email || 'Unknown'
        };
      }
    }));

    // Fetch messages for all tickets
    const ticketIds = tickets.map((t: any) => t.id);
    let messagesMap: Record<string, any[]> = {};
    if (ticketIds.length > 0) {
      const { data: messages } = await supabaseAdmin
        .from('ticket_messages')
        .select('*')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true });
      (messages || []).forEach((m: any) => {
        if (!messagesMap[m.ticket_id]) messagesMap[m.ticket_id] = [];
        messagesMap[m.ticket_id].push(m);
      });
    }

    const finalTickets = tickets.map((ticket: any) => ({
      ...ticket,
      user: usersData[ticket.user_id] || { username: 'Unknown', email: 'Unknown' },
      messages: messagesMap[ticket.id] || []
    }));

    return NextResponse.json({ success: true, data: finalTickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

  try {
    const { id, status, admin_reply } = await request.json();

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (admin_reply !== undefined) updateData.admin_reply = admin_reply;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}