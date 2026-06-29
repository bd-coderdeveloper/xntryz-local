import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy')
);

// Helper to get today's date in GMT+7
const getTodayDateString = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No authorization header' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.user_metadata?.is_banned) {
      return NextResponse.json({ error: 'Banned', is_banned: true }, { status: 403 });
    }

    const todayStr = getTodayDateString();

    const { data, error } = await supabaseAdmin
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('usage_date', todayStr)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || {
        posts_removed_count: 0,
        posts_cloned_count: 0,
        one_card_count: 0,
        group_posts_removed_count: 0,
        group_auto_posts_count: 0,
        auto_create_pages_count: 0,
        usage_date: todayStr
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No authorization header' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, count = 1, target_type, target_id, target_name } = body;

    const validActions = ['remove', 'clone', 'onecard', 'group_remove', 'group_auto_post', 'auto_create'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const todayStr = getTodayDateString();

    const usageParams = {
      p_user_id: user.id,
      p_usage_date: todayStr,
      p_remove_inc: action === 'remove' ? count : 0,
      p_clone_inc: action === 'clone' ? count : 0,
      p_onecard_inc: action === 'onecard' ? count : 0,
      p_group_remove_inc: action === 'group_remove' ? count : 0,
      p_group_auto_post_inc: action === 'group_auto_post' ? count : 0,
      p_auto_create_inc: action === 'auto_create' ? count : 0,
    };

    const { error: rpcError } = await supabaseAdmin.rpc('increment_user_usage_v4', usageParams);

    if (rpcError) {
      throw rpcError;
    }

    if (target_type && target_id && target_name) {
      const { error: logError } = await supabaseAdmin
        .from('user_facebook_activity')
        .insert({
          user_id: user.id,
          target_type,
          target_id,
          target_name,
          action
        });
      if (logError) {
        console.error('Failed to log FB activity:', logError);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}