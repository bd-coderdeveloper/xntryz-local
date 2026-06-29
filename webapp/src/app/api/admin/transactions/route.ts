import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  // Get transactions without the invalid auth.users join
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map to get signed URLs for slip_images and format auth details via Admin API
  const transWithSignedUrls = await Promise.all((data || []).map(async (t) => {
    let slip_url_signed = null;
    if (t.slip_image_url) {
      const { data: signData } = await supabaseAdmin.storage
        .from('payment_slips')
        .createSignedUrl(t.slip_image_url, 60 * 60 * 24); // 24 hours valid
      if (signData) slip_url_signed = signData.signedUrl;
    }

    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(t.user_id);

    return {
      ...t,
      slip_url_signed,
      user_email: user?.email || 'Unknown',
      username: user?.user_metadata?.username || 'Unknown'
    };
  }));

  return NextResponse.json({ transactions: transWithSignedUrls });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

  try {
    const { id, action, admin_comment } = await request.json();

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data: transaction, error: tError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (tError || !transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'pending') throw new Error('รายการนี้ถูกจัดการไปแล้ว');

    // If approve, top up the user's wallet
    if (newStatus === 'approved') {
      if (transaction.transaction_type === 'topup' || !transaction.transaction_type) {
        // Get user's current package data
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(transaction.user_id);
        if (userData.user) {
          const currentBalance = parseFloat(userData.user.user_metadata?.wallet_balance || '0');
          const addedAmount = transaction.amount || 0;
          const newBalance = currentBalance + addedAmount;

          await supabaseAdmin.auth.admin.updateUserById(transaction.user_id, {
            user_metadata: {
              wallet_balance: newBalance
            }
          });
        }
      }
    }

    // Update Transaction
    const { error: updError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: newStatus,
        admin_comment: admin_comment || (newStatus === 'approved' ? 'Manual Approve' : ''),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updError) throw updError;

    return NextResponse.json({ success: true, newStatus });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}