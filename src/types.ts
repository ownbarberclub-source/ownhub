// =============================================================
//  OWN HUB — Types
// =============================================================

export type AppSite = {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
  category: string;
  is_active: boolean;
  order_index: number;
  available_roles: string[]; // Funções disponíveis neste site
};

export type HubUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
  avatar_initials: string;
  is_active: boolean;
  created_at: string;
};

export type UserPermission = {
  id: string;
  user_id: string;
  site_id: string;
  role: string; // Função do usuário neste site
};

export type Session = {
  user: HubUser;
  token: string;
  expires_at: number;
};
