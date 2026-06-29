import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  // Fetch all users using admin API
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch today's usage stats
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const { data: usageData } = await supabaseAdmin
    .from('user_daily_usage')
    .select('*')
    .eq('usage_date', todayStr);

  const usageMap = new Map();
  if (usageData) {
     usageData.forEach(row => usageMap.set(row.user_id, row));
  }

  const enrichedUsers = users.map(user => {
    return {
      ...user,
      today_usage: usageMap.get(user.id) || null
    };
  });

  return NextResponse.json({ users: enrichedUsers });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, action, value } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    if (action === 'ban') {
      // Use App-level ban so users can still log in and use Support Tickets
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { is_banned: value },
        ban_duration: 'none', // Reset hard-ban so they can authenticate
      });
      if (error) throw error;
      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === 'package') {
      // Update package in user_metadata
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { package: value } // e.g. 'Free', 'Pro', 'Premium'
      });
      if (error) throw error;
      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === 'expire') {
      // Update package_expire in user_metadata
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { package_expire: value }
      });
      if (error) throw error;
      return NextResponse.json({ success: true, user: data.user });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}