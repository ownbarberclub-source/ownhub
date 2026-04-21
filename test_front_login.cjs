const { createClient } = require('@supabase/supabase-js');

// Usando ANON KEY que simula o Front End!!! (O erro de RLS aparece aqui)
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient('https://tvjbtlsxibcpahpizksd.supabase.co', supabaseAnonKey);

async function testFrontEndLogin() {
  const { data: { session }, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'ownbarberclub@gmail.com',
    password: 'AdministrativoOwn7.'
  });

  if (authErr) {
    console.log('Login falhou:', authErr);
    return;
  }

  const userId = session.user.id;
  // Testando leitura do profile no Client
  const { data: profile, error: profErr } = await supabase.from('hub_profiles').select('*').eq('id', userId).single();
  
  if (profErr) {
    console.error('ERRO AO LER PERFIL PELO FRONTEND (PROVÁVEL RLS):', profErr);
  } else {
    console.log('Perfil lido pelo FrontEnd com Sucesso => Role:', profile?.role);
  }
}

testFrontEndLogin();
