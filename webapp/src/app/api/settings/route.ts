import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function GET() {
  const { data: settings, error } = await supabaseAdmin
    .from('system_settings')
    .select('key, value');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settingsObj: Record<string, string> = {};
  settings?.forEach((row: any) => {
    settingsObj[row.key] = row.value;
  });

  return NextResponse.json({ settings: settingsObj });
}
