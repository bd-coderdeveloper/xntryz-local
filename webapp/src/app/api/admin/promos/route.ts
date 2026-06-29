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

  const { data: promos, error } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!promos || promos.length === 0) return NextResponse.json({ promos: [] });

  const promoIds = promos.map(p => p.id);
  const { data: redemptions, error: redemptionsError } = await supabaseAdmin
    .from('code_redemptions')
    .select('*')
    .in('promo_code_id', promoIds);

  if (redemptionsError) return NextResponse.json({ error: redemptionsError.message }, { status: 500 });

  const uniqueUserIds = Array.from(new Set((redemptions || []).map(r => r.user_id)));
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

  const finalPromos = promos.map(promo => {
    const promoRedemptions = (redemptions || []).filter(r => r.promo_code_id === promo.id);
    const redeemed_by = promoRedemptions.map(r => ({
      ...(usersData[r.user_id] || { username: 'Unknown User', email: 'Unknown' }),
      redeemed_at: r.redeemed_at
    }));
    return { ...promo, redeemed_by };
  });

  return NextResponse.json({ promos: finalPromos });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

  try {
    const { code, reward_package, reward_days, reward_balance, max_uses, valid_until } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .insert([{
        code: code.toUpperCase(),
        reward_package,
        reward_days: parseInt(reward_days) || 0,
        reward_balance: parseFloat(reward_balance) || 0,
        max_uses: parseInt(max_uses) || 0,
        valid_until: valid_until ? new Date(valid_until).toISOString() : null
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, promo: data });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Code ซ้ำกับที่มีในระบบแล้ว' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}