import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }

  console.log('Total users:', data.users.length);
  data.users.forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Username: ${u.user_metadata?.username}, Usernames Metadata:`, u.user_metadata);
  });
}

main();