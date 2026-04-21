/**
 * ============================================================
 *  OWN HUB — access-control.js
 *  Script de proteção para sub-sites do OWN Hub.
 *
 *  COMO USAR:
 *  Adicione este script em cada sub-site que deve ser
 *  protegido pelo OWN Hub. Coloque antes do fechamento
 *  do </body> ou no início do seu arquivo principal.
 *
 *  Para sites React/Vite, importe este script no main.tsx:
 *    import './access-control';
 *
 *  Para sites HTML puro, adicione a tag:
 *    <script src="/access-control.js"></script>
 * ============================================================
 */

(function () {
  'use strict';

  // ─── Configurações ─────────────────────────────────────────
  const HUB_URL = 'https://own-hub.vercel.app'; // URL do OWN Hub em produção
  const HUB_SESSION_KEY = '@own-hub:session';
  const TOKEN_PARAM = 'hub_token';
  const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

  // Lista de paths que não precisam de autenticação (ex: páginas públicas)
  const PUBLIC_PATHS = [];

  // ─── Verificação do Token na URL (Relay) ──────────────────
  function parseRelayFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get(TOKEN_PARAM);
    const email = params.get('hub_user');
    const name = params.get('hub_name');

    if (!token || !email) return null;

    try {
      const decoded = JSON.parse(atob(token));
      if (!decoded.uid || !decoded.exp) return null;
      if (Date.now() > decoded.exp) return null;

      return {
        userId: decoded.uid,
        userEmail: email,
        userName: name || email,
        token,
        expiresAt: decoded.exp,
        userRole: 'operator',
      };
    } catch (e) {
      return null;
    }
  }

  // ─── Verificar Sessão Local ───────────────────────────────
  function getLocalSession() {
    try {
      const raw = localStorage.getItem(HUB_SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(HUB_SESSION_KEY);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  // ─── Salvar Sessão Local ──────────────────────────────────
  function saveLocalSession(session) {
    localStorage.setItem(HUB_SESSION_KEY, JSON.stringify(session));
  }

  // ─── Redirecionar para o Hub ──────────────────────────────
  function redirectToHub() {
    const currentUrl = encodeURIComponent(window.location.href);
    const hubRedirect = `${HUB_URL}?redirect=${currentUrl}`;

    // Mostra mensagem antes de redirecionar
    document.body.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
        padding: 24px;
      ">
        <div style="text-align: center; max-width: 440px;">
          <div style="
            width: 64px; height: 64px; border-radius: 16px;
            background: linear-gradient(135deg, #E10600, #B00400);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px; font-size: 28px;
          ">✂️</div>
          <div style="
            font-size: 28px; font-weight: 900; color: #fff;
            text-transform: uppercase; letter-spacing: -0.02em;
            margin-bottom: 8px; font-style: italic;
          ">
            OWN <span style="color: #E10600">HUB</span>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
            Este sistema é de acesso restrito.<br>
            Por favor, acesse pelo <strong style="color: #fff">OWN Hub</strong>.
          </p>
          <a href="${hubRedirect}"
            style="
              display: inline-flex; align-items: center; gap: 8px;
              background: #E10600; color: #fff; text-decoration: none;
              padding: 14px 28px; border-radius: 12px;
              font-weight: 700; font-size: 13px;
              text-transform: uppercase; letter-spacing: 0.08em;
              box-shadow: 0 8px 24px rgba(225,6,0,0.3);
            "
          >
            → Ir para o OWN Hub
          </a>
          <div style="color: #333; font-size: 11px; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.2em;">
            Redirecionando automaticamente em <span id="own-countdown">5</span>s...
          </div>
        </div>
      </div>
    `;

    // Contagem regressiva
    let count = 5;
    const el = document.getElementById('own-countdown');
    const interval = setInterval(() => {
      count--;
      if (el) el.textContent = count;
      if (count <= 0) {
        clearInterval(interval);
        window.location.href = hubRedirect;
      }
    }, 1000);
  }

  // ─── Limpeza dos parâmetros do Token na URL ───────────────
  function cleanUrlParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete(TOKEN_PARAM);
    url.searchParams.delete('hub_user');
    url.searchParams.delete('hub_name');
    try {
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      // ignora erros de history
    }
  }

  // ─── Verificação Principal ────────────────────────────────
  function checkAccess() {
    // Verificar se o path atual é público
    const currentPath = window.location.pathname;
    if (PUBLIC_PATHS.some(p => currentPath.startsWith(p))) return;

    // 1. Verificar token relay na URL (vinda do Hub)
    const relaySession = parseRelayFromUrl();
    if (relaySession) {
      saveLocalSession(relaySession);
      cleanUrlParams();
      console.log('[OWN Hub] ✅ Autenticado via token relay:', relaySession.userEmail);

      // Expor sessão globalmente para uso no app
      window.__OWN_HUB_SESSION__ = relaySession;
      return;
    }

    // 2. Verificar sessão local existente
    const localSession = getLocalSession();
    if (localSession) {
      console.log('[OWN Hub] ✅ Sessão local válida:', localSession.userEmail);
      window.__OWN_HUB_SESSION__ = localSession;
      return;
    }

    // 3. Nenhuma sessão válida → redirecionar para o Hub
    console.warn('[OWN Hub] ⛔ Acesso negado. Redirecionando para o Hub...');
    redirectToHub();
  }

  // ─── Executar imediatamente ───────────────────────────────
  // Para sites SPA (React), execute assim que o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAccess);
  } else {
    checkAccess();
  }

  // ─── API Pública ──────────────────────────────────────────
  // Útil para obter os dados do usuário logado no app
  window.OwnHub = {
    getSession: () => window.__OWN_HUB_SESSION__ || null,
    getUserEmail: () => window.__OWN_HUB_SESSION__?.userEmail || null,
    getUserName: () => window.__OWN_HUB_SESSION__?.userName || null,
    isAuthenticated: () => !!window.__OWN_HUB_SESSION__,
  };
})();
