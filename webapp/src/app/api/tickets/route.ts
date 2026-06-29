import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'No authorization header' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch messages for all tickets
    const ticketIds = (tickets || []).map((t: any) => t.id);
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

    const finalTickets = (tickets || []).map((t: any) => ({ ...t, messages: messagesMap[t.id] || [] }));
    return NextResponse.json({ success: true, data: finalTickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'No authorization header' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const { subject, message, image_url, phone } = await request.json();

    if (!subject || !message || !phone) {
      return NextResponse.json({ error: 'Subject, message, and phone number are required' }, { status: 400 });
    }

    // Check if the user already has an active ticket (not resolved)
    const { data: activeTickets, error: checkError } = await supabaseAdmin
      .from('support_tickets')
      .select('id')
      .eq('user_id', user.id)
      .neq('status', 'resolved');

    if (checkError) throw checkError;

    if (activeTickets && activeTickets.length > 0) {
      return NextResponse.json({ error: 'คุณมีรายการแจ้งปัญหาที่กำลังดำเนินการอยู่ กรุณารอให้รายการเดิมเสร็จสิ้นก่อนแจ้งปัญหาใหม่' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert([{
        user_id: user.id,
        subject,
        message,
        phone,
        image_url,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    // Send SMS via thsms.com API
    const thsmsUsername = process.env.THSMS_USERNAME;
    const thsmsPassword = process.env.THSMS_PASSWORD;
    const thsmsApiKey = process.env.THSMS_API_KEY;

    if ((thsmsApiKey || (thsmsUsername && thsmsPassword)) && phone) {
      try {
        const cleanPhone = phone.replace(/\D/g, ''); // Ensure digits only
        const smsMessage = 'UPFEEDTH: ทีมงานได้รับแจ้งปัญหาเรียบร้อยแล้ว\nกรุณารอทีมงานติดต่อกลับ';
        const senderName = 'BD Privacy'

        if (thsmsApiKey) {
          // THSMS API V2 (Bearer Token)
          const res = await fetch('https://thsms.com/api/send-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${thsmsApiKey}`
            },
            body: JSON.stringify({
              sender: senderName,
              msisdn: [cleanPhone],
              message: smsMessage
            })
          });
          const text = await res.text();
          console.log('THSMS V2 Response:', text);
          data.thsms_debug = text; // For debugging
        } else if (thsmsUsername && thsmsPassword) {
          // THSMS API V1 (Legacy)
          const res = await fetch('https://api.thsms.com/send_sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              username: thsmsUsername,
              password: thsmsPassword,
              sender: senderName,
              destination: cleanPhone,
              message: smsMessage
            })
          });
          const text = await res.text();
          console.log('THSMS V1 Response:', text);
        }
      } catch (smsErr) {
        console.error('Failed to send THSMS:', smsErr);
      }
    }

    // Send Telegram Notification
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChatId) {
      try {
        const text = `🚨 *แจ้งปัญหาใหม่ (New Ticket)*\n\n*หัวข้อ:* ${subject}\n*จาก:* ${user.email}\n*เบอร์ติดต่อ:* ${phone}\n\n*รายละเอียด:*\n${message}`;

        if (image_url) {
          await fetch(`https://api.telegram.org/bot${tgToken}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: tgChatId,
              photo: image_url,
              caption: text,
              parse_mode: 'Markdown'
            })
          });
        } else {
          await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: tgChatId, text, parse_mode: 'Markdown' })
          });
        }
      } catch (e) {
        console.error('Telegram Error:', e);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}