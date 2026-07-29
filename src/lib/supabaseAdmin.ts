import { supabase } from '../supabaseClient';

// AVISO DE SEGURANÇA: A chave service_role foi removida do frontend por segurança.
// Operações administrativas de banco devem usar o cliente padrão autenticado com RLS.
export const supabaseAdmin = supabase;

