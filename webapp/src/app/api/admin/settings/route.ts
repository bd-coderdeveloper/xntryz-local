import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Setup Supabase Admin Client
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

// This is required to access admin functions
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to check if current user is an admin
async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { error: 'No authorization header', user: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { error: 'Invalid token', user: null };
  }

  const adminUsernames = (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || 'admin').split(',').map(u => u.trim().toLowerCase());
  const username = (user.user_metadata?.username || '').toLowerCase();

  if (!adminUsernames.includes(username)) {
    return { error: 'Unauthorized: Not an admin', user };
  }

  return { error: null, user };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

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

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
    
    return NextResponse.json({ success: true, key, value });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
