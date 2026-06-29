import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(request: Request) {
  try {
    // 1. Validate User
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    const requestedAmountStr = formData.get('amount') as string || '0';
    const parsedAmount = parseFloat(requestedAmountStr);

    if (!file) {
      return NextResponse.json({ error: 'กรุณาอัปโหลดรูปสลิป' }, { status: 400 });
    }
    if (parsedAmount <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินต้องมากกว่า 0' }, { status: 400 });
    }

    // 3. Upload File to Supabase Storage "payment_slips"
    const fileExt = file.type.split('/')[1] || 'jpeg';
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError, data: uploadData } = await supabaseAdmin.storage
      .from('payment_slips')
      .upload(fileName, file, { upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: 'ไม่สามารถอัปโหลดไฟล์สลิปขึ้นระบบได้' }, { status: 500 });
    }

    const slipUrl = uploadData?.path;

    // 4. Checking SlipOK Verification
    const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY;
    const SLIPOK_BRANCH_ID = process.env.SLIPOK_BRANCH_ID;

    if (SLIPOK_API_KEY && SLIPOK_BRANCH_ID) {
      // **AUTO-APPROVE SCENARIO VIA SLIPOK**
      const slipOkFormData = new FormData();
      slipOkFormData.append('files', file);
      // Wait, SlipOK API verifies the exact amount when amount is passed, so we pass it
      slipOkFormData.append('amount', parsedAmount.toString());

      const slipOkRes = await fetch(`https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`, {
        method: 'POST',
        headers: {
          'x-authorization': SLIPOK_API_KEY
        },
        body: slipOkFormData
      });

      const slipData = await slipOkRes.json();

      if (slipData.success) {
        // Auto Upgrade the wallet balance!
        const currentBalance = parseFloat(user.user_metadata?.wallet_balance || '0');
        const newBalance = currentBalance + parsedAmount;

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { wallet_balance: newBalance }
        });

        // Record as approved
        await supabaseAdmin.from('transactions').insert([{
          user_id: user.id,
          slip_image_url: slipUrl,
          amount: parsedAmount,
          transaction_type: 'topup',
          status: 'approved',
          admin_comment: 'Auto-Approved by SlipOK'
        }]);

        return NextResponse.json({ success: true, autoApproved: true, message: `เติมเงินเข้ากระเป๋าสำเร็จ ${parsedAmount} บาท!` });
      } else {
        // Log the failure but keep it pending so admin can manually verify if SlipOK fails
        await supabaseAdmin.from('transactions').insert([{
          user_id: user.id,
          slip_image_url: slipUrl,
          amount: parsedAmount,
          transaction_type: 'topup',
          status: 'rejected', // SlipOK explicitly rejected it (Wrong amount / duplicate)
          admin_comment: `SlipOK Auto-Reject: ${slipData.message}`
        }]);
        return NextResponse.json({ error: `สลิปถูกปฏิเสธ: ${slipData.message}` }, { status: 400 });
      }
    } else {
      // **MANUAL VERIFICATION SCENARIO (Fallback or Default)**
      await supabaseAdmin.from('transactions').insert([{
        user_id: user.id,
        slip_image_url: slipUrl,
        amount: parsedAmount,
        transaction_type: 'topup',
        status: 'pending'
      }]);

      return NextResponse.json({ success: true, autoApproved: false, message: 'อัปโหลดสลิปเรียบร้อย รอแอดมินยืนยันรายการครับ' });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}