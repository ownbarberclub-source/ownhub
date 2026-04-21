const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc2NDU1OCwiZXhwIjoyMDkyMzQwNTU4fQ.9I6yiVhTqU87h3lBGxrcevVUQLASMG74s0tT9YtWEEo';

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkAndFixAdmin() {
  const email = 'ownbarberclub@gmail.com';
  
  // 1. Busca id 
  const { data: searchUsers } = await supabase.auth.admin.listUsers();
  const existing = searchUsers.users.find(u => u.email === email);
  
  if (!existing) {
     console.log('Usuário não consta no auth.users');
     return;
  }
  const userId = existing.id;
  console.log('UserId:', userId);
  
  // 2. Busca na tabela
  let { data: profile } = await supabase.from('hub_profiles').select('*').eq('id', userId).single();
  console.log('Role salva no DB:', profile?.role || 'N/A');

  // 3. Força Update
  await supabase.from('hub_profiles').update({ role: 'admin' }).eq('id', userId);
  
  // Confirmação
  let { data: prof2 } = await supabase.from('hub_profiles').select('*').eq('id', userId).single();
  console.log('Role forçada após update:', prof2?.role);
}

checkAndFixAdmin();
