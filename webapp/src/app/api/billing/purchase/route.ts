import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const requestedPackage = body.package;

    if (!['Pro', 'Premium'].includes(requestedPackage)) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const packageCost = requestedPackage === 'Premium' ? 899 : 500;
    const rewardDays = 30; // 30 days logic

    // Check Wallet Balance
    const currentBalance = parseFloat(user.user_metadata?.wallet_balance || '0');

    if (currentBalance < packageCost) {
      return NextResponse.json({ error: `เครดิตไม่เพียงพอ (ต้องการ ${packageCost} บาท แต่มี ${currentBalance} บาท)` }, { status: 400 });
    }

    const newBalance = currentBalance - packageCost;

    // Calculate new expire date
    let baseDate = new Date();
    const currentExpire = user.user_metadata?.package_expire;
    if (currentExpire) {
      const currentExpDate = new Date(currentExpire);
      if (currentExpDate > baseDate && user.user_metadata?.package === requestedPackage) {
        baseDate = currentExpDate; // Extend from current expire if same package
      }
    }

    baseDate.setDate(baseDate.getDate() + rewardDays);
    const newExpire = baseDate.toISOString();

    // Update user metadata (deduct balance, set package)
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        wallet_balance: newBalance,
        package: requestedPackage,
        package_expire: newExpire
      }
    });

    // Insert purchase transaction
    await supabaseAdmin.from('transactions').insert([{
      user_id: user.id,
      amount: -packageCost,
      transaction_type: 'purchase',
      requested_package: requestedPackage,
      status: 'approved',
      admin_comment: 'Purchased via Wallet Balance'
    }]);

    return NextResponse.json({
      success: true,
      message: `สั่งซื้อแพ็กเกจ ${requestedPackage} สำเร็จ! หักเงิน ${packageCost} บาท`,
      newBalance,
      newExpire
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}