const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc2NDU1OCwiZXhwIjoyMDkyMzQwNTU4fQ.9I6yiVhTqU87h3lBGxrcevVUQLASMG74s0tT9YtWEEo';

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createHubAdmin() {
  const email = 'ownbarberclub@gmail.com';
  const password = 'AdministrativoOwn7.';
  const name = 'Admin OWN';

  console.log('Criando AuthUser...');
  // 1. Cria ou atualizar auth 
  const { data: userResp, error: userErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  let userId;
  if (userErr) {
    if (userErr.message.includes('already been registered')) {
        console.log('Usuario de email ja existe... Tentando trocar senha pra ' + password);
        // Atualizar user
        const { data: searchUsers } = await supabase.auth.admin.listUsers();
        const existing = searchUsers.users.find(u => u.email === email);
        if (existing) {
             userId = existing.id;
             await supabase.auth.admin.updateUserById(userId, { password });
        }
    } else {
        console.error('Falha:', userErr.message);
        return;
    }
  } else {
    userId = userResp.user.id;
  }

  console.log('ID do Usuário:', userId);

  // 2. Criar permissao hub_profile admin
  const profile = {
    id: userId,
    name: name,
    role: 'admin',
    avatar_initials: 'AD',
    is_active: true
  };

  const { error: profErr } = await supabase.from('hub_profiles')
    .upsert([profile]);

  if (profErr) {
    console.error('Falha a atualizar profile:', profErr);
  } else {
    console.log('SUCESSO! Admin criado/atualizado.');
  }
}

createHubAdmin();
