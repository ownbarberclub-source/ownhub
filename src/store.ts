// =============================================================
//  OWN HUB — Supabase Store
//  Sincronização Online Completa com as tabelas hub_*
// =============================================================

import { supabase } from './lib/supabase';
import { supabaseAdmin } from './lib/supabaseAdmin';
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

export async function addUser(user: Omit<HubUser, 'id' | 'created_at'>, pass: string): Promise<HubUser | null> {
  try {
    // 1. Cria o usuário no Supabase Auth via Admin API
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: pass,
      email_confirm: true,
    });

    if (authErr) {
      console.error('Erro ao criar usuário Auth:', authErr.message);
      alert(`Erro ao criar usuário: ${authErr.message}`);
      return null;
    }

    const authUserId = authData.user.id;

    // 2. Cria o Profile na tabela hub_profiles
    const newProfile = {
      id: authUserId,
      name: user.name,
      role: user.role,
      avatar_initials: user.avatar_initials,
      is_active: user.is_active,
    };

    const { data, error: profileErr } = await supabaseAdmin.from('hub_profiles').insert([newProfile]).select().single();

    if (profileErr) {
      console.error('Erro ao criar Profile:', profileErr);
      // Se falhou o profile, tenta remover o auth user criado
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      alert('Erro ao criar perfil do usuário. Tente novamente.');
      return null;
    }

    return data;
  } catch (e: any) {
    console.error('Erro inesperado addUser:', e);
    alert(`Erro inesperado: ${e.message}`);
    return null;
  }
}

export async function updateUser(id: string, updates: Partial<HubUser>, newPass?: string): Promise<void> {
  // Update Profile
  await supabaseAdmin.from('hub_profiles').update({
    name: updates.name,
    role: updates.role,
    is_active: updates.is_active
  }).eq('id', id);

  // Update Auth (senha e/ou email) via Admin API
  const authUpdates: Record<string, string> = {};
  if (updates.email) authUpdates.email = updates.email;
  if (newPass) authUpdates.password = newPass;

  if (Object.keys(authUpdates).length > 0) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
    if (error) {
      console.error('Erro ao atualizar Auth:', error.message);
      alert(`Erro ao atualizar credenciais: ${error.message}`);
    }
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    // 1. Remove permissões do usuário
    await supabaseAdmin.from('hub_permissions').delete().eq('user_id', id);

    // 2. Remove o profile
    await supabaseAdmin.from('hub_profiles').delete().eq('id', id);

    // 3. Remove o usuário do Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      console.error('Erro ao deletar usuário Auth:', error.message);
      alert(`Erro ao remover usuário: ${error.message}`);
    }
  } catch (e: any) {
    console.error('Erro inesperado deleteUser:', e);
    alert(`Erro inesperado: ${e.message}`);
  }
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
