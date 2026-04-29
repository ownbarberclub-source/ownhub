import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Client admin com service_role key para operações de gerenciamento de usuários.
// NOTA: Este client só deve ser usado internamente pelo painel de administração.
export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceRoleKey || 'missing_key_prevent_crash', 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
