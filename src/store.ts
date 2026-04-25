// =============================================================
//  OWN HUB — Supabase Store
//  Sincronização Online Completa com as tabelas hub_*
// =============================================================

import { supabase } from './lib/supabase';
import type { AppSite, HubUser, UserPermission } from './types';

// ─────────────────────────────────────────────
//  SITES
// ─────────────────────────────────────────────

export async function getSites(): Promise<AppSite[]> {
  const { data, error } = await supabase.from('hub_sites').select('*').order('order_index', { ascending: true });
  if (error) console.error('Erro getSites:', error);
  return data || [];
}

export async function addSite(site: Omit<AppSite, 'id'>): Promise<AppSite | null> {
  const newId = `site-${crypto.randomUUID()}`;
  const { data, error } = await supabase.from('hub_sites').insert([{ id: newId, ...site }]).select().single();
  if (error) console.error('Erro addSite:', error);
  return data;
}

export async function updateSite(id: string, updates: Partial<AppSite>): Promise<void> {
  const { id: _, ...payload } = updates;
  const { error } = await supabase.from('hub_sites').update(payload).eq('id', id);
  if (error) console.error('Erro updateSite:', error);
}

export async function deleteSite(id: string): Promise<void> {
  const { error } = await supabase.from('hub_sites').delete().eq('id', id);
  if (error) console.error('Erro deleteSite:', error);
}

// ─────────────────────────────────────────────
//  USUÁRIOS / PROFILE
// ─────────────────────────────────────────────

export async function getUsers(): Promise<HubUser[]> {
  const { data, error } = await supabase.from('hub_profiles').select('*');
  if (error) console.error('Erro getUsers:', error);
  return data || [];
}

export async function addUser(user: Omit<HubUser, 'id' | 'created_at'>, _pass: string): Promise<HubUser | null> {
  // 1. Cria na Auth do Supabase via Edge Function (Seguro)
  // Nota: O admin client não deve ser usado no frontend.
  // Recomenda-se criar uma Supabase Edge Function 'manage-users' para isso.
  /*
  const { data: response, error: authErr } = await supabase.functions.invoke('manage-users', {
    body: { action: 'create', email: user.email, password: pass }
  });
  if (authErr) return null;
  const authUserId = response.id;
  */

  // Por enquanto, como medida de segurança, o cadastro de novos usuários AUTH 
  // deve ser feito via scripts Node.js (create_admin.cjs) até que a Edge Function seja implantada.
  console.warn('Criação de usuários Auth via frontend desabilitada por segurança.');
  return null;

  // 2. Cria Profile (Abaixo apenas como referência caso use a Edge Function acima)
  const newUser = {
    id: 'placeholder-id', // authUserId,
    name: user.name,
    role: user.role,
    avatar_initials: user.avatar_initials,
    is_active: user.is_active,
  };

  const { data, error: profileErr } = await supabase.from('hub_profiles').insert([newUser]).select().single();
  if (profileErr) console.error('Erro criar Profile:', profileErr);
  return data;
}

export async function updateUser(id: string, updates: Partial<HubUser>, newPass?: string): Promise<void> {
  // Update Profile
  await supabase.from('hub_profiles').update({
    name: updates.name,
    role: updates.role,
    is_active: updates.is_active
  }).eq('id', id);

  // Update Pass ou Email (Via Edge Function)
  /*
  const authUpdates: any = {};
  if (updates.email) authUpdates.email = updates.email;
  if (newPass) authUpdates.password = newPass;

  if (Object.keys(authUpdates).length > 0) {
    await supabase.functions.invoke('manage-users', {
      body: { action: 'update', id, ...authUpdates }
    });
  }
  */
  if (newPass || updates.email) {
    console.warn('Atualização de Auth (senha/email) via frontend desabilitada por segurança.');
  }
}

export async function deleteUser(_id: string): Promise<void> {
  // Delete Profile via Edge Function
  console.warn('Exclusão de usuários Auth via frontend desabilitada por segurança.');
  /*
  const { error } = await supabase.functions.invoke('manage-users', {
    body: { action: 'delete', id }
  });
  */
  // O perfil no banco será deletado se houver ON DELETE CASCADE no DB ligado ao Auth.
}


// ─────────────────────────────────────────────
//  PERMISSÕES
// ─────────────────────────────────────────────

export async function getUserSites(userId: string): Promise<string[]> {
  // Primeiro, verifica seu Role
  const { data: profile } = await supabase.from('hub_profiles').select('role').eq('id', userId).single();
  if (profile?.role === 'admin') {
    const sites = await getSites();
    return sites.map(s => s.id);
  }
  
  // Se for oprador, filtra
  const { data, error } = await supabase.from('hub_permissions').select('site_id').eq('user_id', userId);
  if (error) console.error('Erro getUserSites:', error);
  return data?.map(p => p.site_id) || [];
}

export async function getUserSiteRole(userId: string, siteId: string): Promise<string> {
  const { data: profile } = await supabase.from('hub_profiles').select('role').eq('id', userId).single();
  if (profile?.role === 'admin') return 'administrador';

  const { data } = await supabase.from('hub_permissions').select('role').eq('user_id', userId).eq('site_id', siteId).single();
  return data?.role || 'operador';
}

export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  const { data, error } = await supabase.from('hub_permissions').select('*').eq('user_id', userId);
  if (error) console.error('Erro getUserPerms:', error);
  return data || [];
}

export async function setUserPermissions(
  userId: string,
  perms: { siteId: string; role: string }[]
): Promise<void> {
  // Limpa as antigas
  await supabase.from('hub_permissions').delete().eq('user_id', userId);

  if (perms.length === 0) return;

  const inserts = perms.map(({ siteId, role }) => ({
    user_id: userId,
    site_id: siteId,
    role,
  }));
  
  const { error } = await supabase.from('hub_permissions').insert(inserts);
  if (error) console.error('Erro setUserPermissions:', error);
}

export async function hasPermission(userId: string, siteId: string): Promise<boolean> {
  const sites = await getUserSites(userId);
  return sites.includes(siteId);
}
