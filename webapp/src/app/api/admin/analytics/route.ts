import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy');

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

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    // Compute dates in Bangkok timezone
    const todayString = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const bangkokNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

    let startDate = searchParams.get('start') || todayString;
    let endDate = searchParams.get('end') || todayString;

    if (range === 'today') {
      startDate = todayString;
      endDate = todayString;
    } else if (range === '7d') {
      const start = new Date(bangkokNow);
      start.setDate(bangkokNow.getDate() - 6);
      startDate = start.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      endDate = todayString;
    } else if (range === '15d') {
      const start = new Date(bangkokNow);
      start.setDate(bangkokNow.getDate() - 14);
      startDate = start.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      endDate = todayString;
    } else if (range === 'month') {
      const start = new Date(bangkokNow.getFullYear(), bangkokNow.getMonth(), 1);
      startDate = start.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      endDate = todayString;
    } else if (range === 'year') {
      startDate = `${bangkokNow.getFullYear()}-01-01`;
      endDate = todayString;
    } else if (range === 'custom') {
      if (!startDate) startDate = todayString;
      if (!endDate) endDate = todayString;
    }

    // Fetch rows for the date range
    const { data: rangeData, error: rangeError } = await supabaseAdmin
      .from('user_daily_usage')
      .select('*')
      .gte('usage_date', startDate)
      .lte('usage_date', endDate);

    if (rangeError) throw rangeError;

    // Aggregate by user_id across the range
    const userMap = new Map<string, {
      user_id: string;
      posts_removed_count: number;
      posts_cloned_count: number;
      one_card_count: number;
      group_posts_removed_count: number;
      group_auto_posts_count: number;
      auto_create_pages_count: number;
    }>();

    (rangeData || []).forEach(row => {
      const total = (row.posts_removed_count || 0) + (row.posts_cloned_count || 0) + (row.one_card_count || 0) + (row.group_posts_removed_count || 0) + (row.group_auto_posts_count || 0) + (row.auto_create_pages_count || 0);
      if (total === 0) return;

      if (!userMap.has(row.user_id)) {
        userMap.set(row.user_id, {
          user_id: row.user_id,
          posts_removed_count: 0,
          posts_cloned_count: 0,
          one_card_count: 0,
          group_posts_removed_count: 0,
          group_auto_posts_count: 0,
          auto_create_pages_count: 0,
        });
      }
      const u = userMap.get(row.user_id)!;
      u.posts_removed_count += row.posts_removed_count || 0;
      u.posts_cloned_count += row.posts_cloned_count || 0;
      u.one_card_count += row.one_card_count || 0;
      u.group_posts_removed_count += row.group_posts_removed_count || 0;
      u.group_auto_posts_count += row.group_auto_posts_count || 0;
      u.auto_create_pages_count += row.auto_create_pages_count || 0;
    });

    const validUsers = Array.from(userMap.values());
    const dau = validUsers.length;

    let totalRemoved = 0, totalCloned = 0, totalOneCard = 0, totalGroupRemoved = 0, totalGroupAutoPost = 0, totalAutoCreatePages = 0;
    validUsers.forEach(u => {
      totalRemoved += u.posts_removed_count;
      totalCloned += u.posts_cloned_count;
      totalOneCard += u.one_card_count;
      totalGroupRemoved += u.group_posts_removed_count;
      totalGroupAutoPost += u.group_auto_posts_count;
      totalAutoCreatePages += u.auto_create_pages_count;
    });

    // Top 20 Users for the period
    const topUsersRaw = [...validUsers]
      .sort((a, b) => {
        const totalA = a.posts_removed_count + a.posts_cloned_count + a.one_card_count + a.group_posts_removed_count + a.group_auto_posts_count + a.auto_create_pages_count;
        const totalB = b.posts_removed_count + b.posts_cloned_count + b.one_card_count + b.group_posts_removed_count + b.group_auto_posts_count + b.auto_create_pages_count;
        return totalB - totalA;
      })
      .slice(0, 20);

    const userIds = topUsersRaw.map(u => u.user_id);
    const usersMetadata: Record<string, { username: string; email: string }> = {};

    await Promise.all(userIds.map(async (uid) => {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
      if (user) {
        usersMetadata[uid] = {
          username: user.user_metadata?.username || 'Unknown',
          email: user.email || 'Unknown'
        };
      }
    }));

    const topUsers = topUsersRaw.map(r => ({
      user_id: r.user_id,
      username: usersMetadata[r.user_id]?.username || 'Unknown User',
      email: usersMetadata[r.user_id]?.email || 'Unknown',
      posts_removed: r.posts_removed_count,
      posts_cloned: r.posts_cloned_count,
      one_card: r.one_card_count,
      group_removed: r.group_posts_removed_count,
      group_auto_post: r.group_auto_posts_count,
      auto_create_pages: r.auto_create_pages_count,
      total_actions: r.posts_removed_count + r.posts_cloned_count + r.one_card_count + r.group_posts_removed_count + r.group_auto_posts_count + r.auto_create_pages_count
    }));

    // Fetch target stats from user_facebook_activity
    const { data: activityData, error: activityError } = await supabaseAdmin
      .from('user_facebook_activity')
      .select('target_type, target_id, target_name, user_id, action')
      .gte('created_at', `${startDate}T00:00:00.000Z`)
      .lte('created_at', `${endDate}T23:59:59.999Z`);

    const topTargetsRaw: Record<string, { id: string, name: string, type: string, count: number, userIds: Set<string>, actions: Set<string> }> = {};
    if (activityData && !activityError) {
      activityData.forEach((row: any) => {
        if (!row.target_id) return;
        const key = `${row.target_type}_${row.target_id}`;
        if (!topTargetsRaw[key]) {
          topTargetsRaw[key] = {
            id: row.target_id,
            name: row.target_name || row.target_id,
            type: row.target_type,
            count: 0,
            userIds: new Set(),
            actions: new Set()
          };
        }
        topTargetsRaw[key].count++;
        if (row.user_id) topTargetsRaw[key].userIds.add(row.user_id);
        if (row.action) topTargetsRaw[key].actions.add(row.action);
      });
    }

    const topTargetsList = Object.values(topTargetsRaw)
      .sort((a, b) => b.count - a.count)
      .slice(0, 500); // Return up to 500 Pages/Groups for pagination

    // Collect all user IDs from top targets that we don't have yet
    const targetUserIdsToFetch = new Set<string>();
    topTargetsList.forEach(t => {
      t.userIds.forEach(uid => {
        if (!usersMetadata[uid]) targetUserIdsToFetch.add(uid);
      });
    });

    await Promise.all(Array.from(targetUserIdsToFetch).map(async (uid) => {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
      if (user) {
        usersMetadata[uid] = {
          username: user.user_metadata?.username || 'Unknown',
          email: user.email || 'Unknown'
        };
      }
    }));

    const topTargets = topTargetsList.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      count: t.count,
      users: Array.from(t.userIds).map(uid => ({
        user_id: uid,
        username: usersMetadata[uid]?.username || 'Unknown User',
        email: usersMetadata[uid]?.email || 'Unknown'
      })),
      actions: Array.from(t.actions)
    }));

    return NextResponse.json({
      success: true,
      data: {
        range,
        startDate,
        endDate,
        today: {
          date: todayString,
          dau,
          totalRemoved,
          totalCloned,
          totalOneCard,
          totalGroupRemoved,
          totalGroupAutoPost,
          totalAutoCreatePages,
        },
        topUsers,
        topTargets
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}