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
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const currentPackage = user.user_metadata?.package;
    const packageExpire = user.user_metadata?.package_expire;

    if ((currentPackage === 'Pro' || currentPackage === 'Premium') && packageExpire) {
      const expireDate = new Date(packageExpire);
      const now = new Date();

      // If expired
      if (now >= expireDate) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            package: 'Free',
            package_expire: null,
          }
        });

        if (updateError) throw updateError;
        return NextResponse.json({ updated: true, newPackage: 'Free' });
      }
    }

    return NextResponse.json({ updated: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}