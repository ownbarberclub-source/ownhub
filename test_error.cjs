const { createClient } = require('@supabase/supabase-js');

const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
  const { data: { session }, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'ownbarberclub@gmail.com',
    password: 'AdministrativoOwn7.'
  });

  if (authErr) {
    console.error('Falha login anon:', authErr);
    return;
  }
  console.log('Login OK, userId:', session.user.id);

  // Testa tabela hub_profiles
  const { data: p, error: pErr } = await supabase.from('hub_profiles').select('*');
  console.log('hub_profiles:', p ? p.length : 0, 'erro:', pErr);

  // Testa tabela hub_sites
  const { data: s, error: sErr } = await supabase.from('hub_sites').select('*');
  console.log('hub_sites:', s ? s.length : 0, 'erro:', sErr);

  // Testa tabela previa_units
  const { data: u, error: uErr } = await supabase.from('previa_units').select('*');
  console.log('previa_units:', u ? u.length : 0, 'erro:', uErr);
}

testRLS();
