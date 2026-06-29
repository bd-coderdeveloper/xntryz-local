import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(request: Request) {
  try {
    // 1. Get user from token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: 'กรุณากรอกโค้ดโปรโมชั่น' }, { status: 400 });

    const cleanCode = code.trim().toUpperCase();

    // 2. Fetch Promo Code
    const { data: promo, error: promoError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', cleanCode)
      .single();

    if (promoError || !promo) {
      return NextResponse.json({ error: 'โค้ดไม่มีในระบบหรือไม่ถูกต้อง' }, { status: 404 });
    }

    // 3. Validation
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return NextResponse.json({ error: 'โค้ดนี้หมดอายุไปแล้ว' }, { status: 400 });
    }

    if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) {
      return NextResponse.json({ error: 'โค้ดนี้ถูกใช้งานครบตามจำนวนรวดเร็วไปแล้ว' }, { status: 400 });
    }

    // 4. Check if user already redeemed
    const { data: redemption } = await supabaseAdmin
      .from('code_redemptions')
      .select('id')
      .eq('promo_code_id', promo.id)
      .eq('user_id', user.id)
      .single();

    if (redemption) {
      return NextResponse.json({ error: 'คุณรับสเปซจากโค้ดนี้ไปแล้วครับ' }, { status: 400 });
    }

    // 5. Build new user metadata
    let newPackage = user.user_metadata?.package || 'Free';
    let newExpire = user.user_metadata?.package_expire;
    let newWalletBalance = parseFloat(user.user_metadata?.wallet_balance || '0');

    if (promo.reward_package) {
      newPackage = promo.reward_package;
    }

    if (promo.reward_days > 0) {
      let baseDate = new Date();
      if (newExpire) {
        const currentExpire = new Date(newExpire);
        if (currentExpire > baseDate && newPackage === user.user_metadata?.package) {
          baseDate = currentExpire;
        }
      }
      baseDate.setDate(baseDate.getDate() + promo.reward_days);
      newExpire = baseDate.toISOString();
    }

    if (promo.reward_balance > 0) {
      newWalletBalance += parseFloat(promo.reward_balance);
    }

    // 6. DB Transaction Execution
    // Insert code_redemptions
    const { error: insertError } = await supabaseAdmin
      .from('code_redemptions')
      .insert([{ user_id: user.id, promo_code_id: promo.id }]);

    if (insertError) throw new Error('เกิดข้อผิดพลาดในการบันทึกประวัติการรับโค้ด');

    // Update uses count
    await supabaseAdmin
      .from('promo_codes')
      .update({ used_count: promo.used_count + 1 })
      .eq('id', promo.id);

    // Insert into transaction history
    await supabaseAdmin.from('transactions').insert([{
      user_id: user.id,
      amount: promo.reward_balance || 0,
      transaction_type: 'promo',
      requested_package: promo.reward_package || null,
      promo_code_id: promo.id,
      status: 'approved',
      admin_comment: `แลกโค้ด: ${cleanCode}`
    }]);

    // Update user metadata
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        package: newPackage,
        package_expire: newExpire,
        wallet_balance: newWalletBalance
      }
    });

    return NextResponse.json({
      success: true,
      message: `แลกรับโค้ดสำเร็จ! ยินดีด้วยคุณได้รับสิทธิ์แพ็กเกจ ${newPackage}`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}