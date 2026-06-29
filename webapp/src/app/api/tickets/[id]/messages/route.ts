import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'No authorization header' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const { content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    // Verify ticket belongs to user and is in a replyable status
    const { id } = await params;
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (!['pending', 'investigating'].includes(ticket.status)) {
      return NextResponse.json({ error: 'ไม่สามารถตอบกลับ Ticket ที่เสร็จสิ้นแล้ว' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('ticket_messages')
      .insert({ ticket_id: id, sender_type: 'user', content: content.trim() })
      .select()
      .single();

    if (error) throw error;

    // Send Telegram Notification for Reply
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChatId) {
      try {
        const text = `💬 *ลูกค้ารายงานเพิ่มเติม (Ticket Reply)*\n\n*Ticket ID:* \`${id}\`\n*จาก:* ${user.email}\n\n*ข้อความ:*\n${content.trim()}`;
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'Markdown' })
        });
      } catch (e) {
        console.error('Telegram Error:', e);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}