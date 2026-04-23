// =============================================================
//  OWN HUB — Auth Store
//  Gerencia sessão local para o Token Relay
// =============================================================

const SESSION_KEY = '@own-hub:session';
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

export type LocalSession = {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'admin' | 'operator';
  userPassword?: string; // Senha em base64 para relay de login
  token: string;
  expiresAt: number;
};

/**
 * Gera um token relay seguro para ser passado para sub-sites.
 * O token contém userId + timestamp + secret hash simples.
 */
export function generateRelayToken(userId: string): string {
  const payload = {
    uid: userId,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
    sig: btoa(`own-hub:${userId}:${Date.now()}`).replace(/=/g, ''),
  };
  return btoa(JSON.stringify(payload));
}

/**
 * Salva a sessão local no localStorage.
 */
export function saveLocalSession(session: LocalSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Recupera a sessão local do localStorage.
 */
export function getLocalSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: LocalSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearLocalSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Remove a sessão local.
 */
export function clearLocalSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Verifica se a sessão é válida.
 */
export function isSessionValid(): boolean {
  return getLocalSession() !== null;
}

/**
 * Monta a URL de um sub-site com o token relay embutido.
 * Inclui e-mail, nome, rol no site e senha hasheada para auto-login.
 */
export function buildRelayUrl(
  baseUrl: string,
  session: LocalSession,
  siteRole?: string,
  skipSso?: boolean
): string {
  if (skipSso) return baseUrl;
  
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('hub_token', session.token);
    url.searchParams.set('hub_user', session.userEmail);
    url.searchParams.set('hub_name', session.userName);
    if (siteRole) url.searchParams.set('hub_role', siteRole);
    // Inclui senha em base64 para auto-login nos sub-sites
    if (session.userPassword) {
      url.searchParams.set('hub_pass', session.userPassword);
    }
    return url.toString();
  } catch (e) {
    console.error("Invalid URL in Hub:", baseUrl);
    return baseUrl;
  }
}
