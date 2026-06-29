const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }

  console.log(`Allowed admins: ${process.env.NEXT_PUBLIC_ADMIN_USERNAMES}`);

  data.users.forEach(u => {
    const rawMeta = u.raw_app_meta_data || {};
    const userMeta = u.user_metadata || {};
    console.log(`- Email: ${u.email}`);
    console.log(`  Username (metadata): ${userMeta.username}`);
  });
}
main();