import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors, BarChart3, Users, Star, LogOut, Settings, Plus, Trash2,
  ChevronRight, ChevronUp, ChevronDown, Shield, Globe, Edit2, Check, X, Eye, EyeOff,
  Lock, User, Zap, Building2, LayoutGrid, ExternalLink,
  AlertTriangle, Activity
} from 'lucide-react';
import type { AppSite, HubUser } from './types';
import {
  getSites, addSite, updateSite, deleteSite,
  getUsers, addUser, updateUser, deleteUser,
  getUserSites, getUserPermissions, getUserSiteRole, setUserPermissions,
} from './store';
import { supabase } from './lib/supabase';
import {
  getLocalSession, saveLocalSession, clearLocalSession,
  generateRelayToken, buildRelayUrl,
  type LocalSession,
} from './auth';
import Logo from './assets/logo.png';

// ─── Ícones dinâmicos ───────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.FC<any>> = {
  Scissors, BarChart3, Users, Star, Globe, Zap, Building2, LayoutGrid, Shield, Activity,
};

function SiteIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name];
  
  if (!Icon || name === 'Globe') {
    return (
      <img 
        src={Logo} 
        alt="OC" 
        style={{ 
          width: size, 
          height: size, 
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)' // Make it white to match the icon style
        }} 
      />
    );
  }
  
  return <Icon size={size} />;
}

// ─── Tela de Login ──────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (session: LocalSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError || !data.user) {
        setError('E-mail ou senha inválidos.');
        setLoading(false);
        return;
      }

      // Buscar profile
      const { data: profile } = await supabase.from('hub_profiles').select('*').eq('id', data.user.id).single();

      const userRole = profile?.role || 'operator';
      const userName = profile?.name || email.split('@')[0];
      const token = generateRelayToken(data.user.id);
      
      const session: LocalSession = {
        userId: data.user.id,
        userName: userName,
        userEmail: email,
        userRole: userRole as any,
        userPassword: btoa(password), // Criptografia simples para Relay sub-sites caso necessário
        token,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      };

      saveLocalSession(session);
      onLogin(session);
    } catch (e: any) {
      setError(e.message || 'Erro na conexão ao servidor');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(225,6,0,0.08) 0%, #000 60%)',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* grid fundo */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(225,6,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(225,6,0,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 80, height: 80, borderRadius: 22,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            marginBottom: 20,
            overflow: 'hidden', padding: 12
          }}>
            <img src={Logo} alt="OWN" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div style={{ fontFamily: "'Titillium Web', sans-serif", fontStyle: 'italic', fontWeight: 900, fontSize: 36, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            OWN <span style={{ color: '#E10600' }}>HUB</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 6 }}>
            Portal de Sistemas
          </div>
        </div>

        {/* Card de login */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24, padding: 36, backdropFilter: 'blur(12px)',
        }}>
          <h1 style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 4, fontStyle: 'italic', textTransform: 'uppercase' }}>
            Acessar o Hub
          </h1>
          <p style={{ color: '#555', fontSize: 13, marginBottom: 28 }}>Entre com suas credenciais de operador</p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              color: '#ff6b6b', fontSize: 13, fontWeight: 500,
            }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', display: 'block', marginBottom: 6 }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                <input
                  type="email" required
                  className="input"
                  style={{ paddingLeft: 42 }}
                  placeholder="operador@ownbarberclub.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', display: 'block', marginBottom: 6 }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                <input
                  type={showPass ? 'text' : 'password'} required
                  className="input"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: 8, width: '100%', padding: '15px', fontSize: 13 }}
              disabled={loading}
            >
              {loading ? 'Verificando Nuvem...' : <><ChevronRight size={16} /> Entrar no Hub</>}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, color: '#333', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          OWN BARBER CLUB © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

// ─── Card de Site ───────────────────────────────────────────────────────────
function SiteCard({ site, onAccess }: { site: AppSite; onAccess: (site: AppSite) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? site.color + '50' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20, padding: 28, cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 48px ${site.color}20` : 'none',
        display: 'flex', flexDirection: 'column', gap: 20,
        position: 'relative', overflow: 'hidden',
      }}
      onClick={() => onAccess(site)}
    >
      {/* Glow de cor de fundo */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120,
        borderRadius: '50%', background: site.color,
        opacity: hovered ? 0.08 : 0, transition: 'opacity 0.25s', filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        {/* Ícone */}
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `${site.color}18`,
          border: `1px solid ${site.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: site.color,
          transition: 'all 0.2s',
          boxShadow: hovered ? `0 4px 16px ${site.color}30` : 'none',
        }}>
          <SiteIcon name={site.icon} size={22} />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: site.color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
          {site.category}
        </div>
        <h3 style={{
          fontFamily: "'Titillium Web', sans-serif", fontSize: 22, fontWeight: 900,
          fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.01em',
          marginBottom: 8, color: '#fff',
        }}>
          {site.name}
        </h3>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
          {site.description}
        </p>
      </div>

      <a
        href={buildRelayUrl(site.url, getLocalSession()!, getLocalSession()?.userRole === 'admin' ? 'administrador' : 'operador', site.skip_sso)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px', borderRadius: 12,
          background: hovered ? site.color : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hovered ? site.color : 'rgba(255,255,255,0.08)'}`,
          color: hovered ? '#fff' : '#666',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          cursor: 'pointer', transition: 'all 0.2s',
          position: 'relative', zIndex: 1,
          boxShadow: hovered ? `0 4px 16px ${site.color}40` : 'none',
          textDecoration: 'none'
        }}
      >
        <ExternalLink size={14} /> Acessar Sistema
      </a>
    </div>
  );
}

// ─── Painel de Administração ────────────────────────────────────────────────
function AdminPanel({ session, onRefresh }: { session: LocalSession; onRefresh: () => void }) {
  const [tab, setTab] = useState<'sites' | 'users'>('sites');
  const [sites, setSites] = useState<AppSite[]>([]);
  const [users, setUsers] = useState<HubUser[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  const [editSite, setEditSite] = useState<AppSite | null>(null);
  const [editUser, setEditUser] = useState<HubUser | null>(null);
  // Permissões com função: { siteId, role }
  const [userPerms, setUserPerms] = useState<{ siteId: string; role: string }[]>([]);
  const [editPassword, setEditPassword] = useState('');
  const [showAddSite, setShowAddSite] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const [newSite, setNewSite] = useState<Partial<AppSite>>({
    name: '', description: '', url: '', icon: 'Globe', color: '#6366f1', category: 'Gestão', is_active: true, order_index: 99, available_roles: ['administrador', 'operador'], skip_sso: false,
  });

  const [newUser, setNewUser] = useState<Partial<HubUser> & { password: string }>({
    name: '', email: '', role: 'operator', avatar_initials: '', is_active: true, password: '',
  });

  const loadData = async () => {
    setLoadingConfig(true);
    try {
      const s = await getSites() || [];
      const u = await getUsers() || [];
      setSites(s);
      setUsers(u);
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
      if (onRefresh) onRefresh();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveNewSite = async () => {
    if (!newSite.name || !newSite.url) return;
    try {
      await addSite(newSite as Omit<AppSite, 'id'>);
      setShowAddSite(false);
      setNewSite({ 
        name: '', description: '', url: '', icon: 'Globe', color: '#6366f1', 
        category: 'Gestão', is_active: true, order_index: 99, 
        available_roles: ['administrador', 'operador'], skip_sso: false 
      });
      await loadData();
    } catch (e) {
      alert("Erro ao salvar novo site. Verifique sua conexão.");
    }
  };

  const handleSaveNewUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    const initials = newUser.name!.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const result = await addUser({ name: newUser.name!, email: newUser.email!, role: newUser.role as any, avatar_initials: initials, is_active: true }, newUser.password);
    if (!result) {
      // O erro já é exibido via alert dentro de addUser
      return;
    }
    setShowAddUser(false);
    setNewUser({ name: '', email: '', role: 'operator', avatar_initials: '', is_active: true, password: '' });
    await loadData();
  };

  const handleOpenEditUser = async (user: HubUser) => {
    setEditUser(user);
    const perms = await getUserPermissions(user.id);
    setUserPerms(perms.map(p => ({ siteId: p.site_id, role: p.role || 'operador' })));
    setEditPassword('');
  };

  const handleSaveEditUser = async () => {
    if (!editUser) return;
    await updateUser(editUser.id, { name: editUser.name, email: editUser.email, role: editUser.role, is_active: editUser.is_active }, editPassword);
    await setUserPermissions(editUser.id, userPerms);
    setEditUser(null);
    await loadData();
  };

  const handleSaveEditSite = async () => {
    if (!editSite) return;
    try {
      await updateSite(editSite.id, editSite);
      setEditSite(null);
      await loadData();
    } catch (e) {
      alert("Erro ao atualizar site. As alterações podem não ter sido salvas.");
    }
  };

  const reorderSite = async (siteId: string, direction: 'up' | 'down') => {
    const currentIndex = sites.findIndex(s => s.id === siteId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sites.length) return;

    const newSites = [...sites];
    const [movedSite] = newSites.splice(currentIndex, 1);
    newSites.splice(targetIndex, 0, movedSite);

    // Update state immediately for UX
    setSites(newSites);

    try {
      // Update order_index for all affected sites in DB
      const updates = newSites.map((s, idx) => updateSite(s.id, { order_index: idx }));
      await Promise.all(updates);
    } catch (e) {
      console.error('Erro ao reordenar:', e);
      await loadData(); // Reverte em caso de erro
    }
  };

  // Toggle de acesso ao site (mantendo role existente ou usando o padrão)
  const toggleSiteAccess = (site: AppSite) => {
    const hasAccess = userPerms.some(p => p.siteId === site.id);
    if (hasAccess) {
      setUserPerms(prev => prev.filter(p => p.siteId !== site.id));
    } else {
      const defaultRole = site.available_roles?.[site.available_roles.length - 1] || 'operador';
      setUserPerms(prev => [...prev, { siteId: site.id, role: defaultRole }]);
    }
  };

  // Atualizar role de um site já habilitado
  const updateSiteRole = (siteId: string, role: string) => {
    setUserPerms(prev => prev.map(p => p.siteId === siteId ? { ...p, role } : p));
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 24,
  };

  if (loadingConfig) {
    return <div style={{ color: '#E10600', padding: 40, textAlign: 'center' }}>Sincronizando Banco de Dados da Nuvem...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { id: 'sites', label: 'Sites', icon: Activity },
          { id: 'users', label: 'Usuários', icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className="btn"
            onClick={() => setTab(id as any)}
            style={{
              padding: '10px 20px',
              background: tab === id ? '#E10600' : 'rgba(255,255,255,0.04)',
              color: tab === id ? '#fff' : '#666',
              border: `1px solid ${tab === id ? '#E10600' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── SITES ── */}
      {tab === 'sites' && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: 18, fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' }}>
              Sites Cadastrados
            </h2>
            <button className="btn btn-primary" style={{ padding: '9px 16px', fontSize: 12 }} onClick={() => setShowAddSite(true)}>
              <Plus size={14} /> Novo Site
            </button>
          </div>

          {showAddSite && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: '#E10600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>+ Novo Site</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Nome', key: 'name', placeholder: 'OWN Exemplo' },
                  { label: 'URL', key: 'url', placeholder: 'https://...' },
                  { label: 'Categoria', key: 'category', placeholder: 'Gestão' },
                  { label: 'Cor (hex)', key: 'color', placeholder: '#6366f1' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input className="input" style={{ fontSize: 13 }} placeholder={f.placeholder} value={(newSite as any)[f.key] || ''} onChange={e => setNewSite({ ...newSite, [f.key]: e.target.value })} />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Descrição</label>
                  <input className="input" style={{ fontSize: 13 }} placeholder="Breve descrição do sistema..." value={newSite.description || ''} onChange={e => setNewSite({ ...newSite, description: e.target.value })} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <input type="checkbox" checked={!!newSite.skip_sso} onChange={e => setNewSite({ ...newSite, skip_sso: e.target.checked })} style={{ cursor: 'pointer' }} id="new-skip-sso" />
                  <label htmlFor="new-skip-sso" style={{ fontSize: 11, fontWeight: 700, color: '#aaa', cursor: 'pointer' }}>Pular Login Automático (SSO)</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '9px 16px' }} onClick={handleSaveNewSite}><Check size={13} /> Salvar</button>
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowAddSite(false)}><X size={13} /> Cancelar</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sites.map(site => (
              <div key={site.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${site.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: site.color, flexShrink: 0 }}>
                  <SiteIcon name={site.icon} size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{site.name}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{site.url}</div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '2px 4px', fontSize: 10, height: 'auto', minHeight: 0 }}
                      disabled={sites.indexOf(site) === 0}
                      onClick={() => reorderSite(site.id, 'up')}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '2px 4px', fontSize: 10, height: 'auto', minHeight: 0 }}
                      disabled={sites.indexOf(site) === sites.length - 1}
                      onClick={() => reorderSite(site.id, 'down')}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => setEditSite(site)}><Edit2 size={12} /></button>
                  <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 11 }} onClick={async () => { if (confirm(`Remover "${site.name}"?`)) { await deleteSite(site.id); await loadData(); } }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de edição de site */}
          {editSite && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                padding: 32, width: '100%', maxWidth: 500,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: 20, fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' }}>
                    Editar Site: {editSite.name}
                  </h3>
                  <button className="btn btn-ghost" onClick={() => setEditSite(null)} style={{ padding: '6px 10px' }}><X size={16} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Nome do Site', key: 'name' },
                    { label: 'URL de Acesso', key: 'url' },
                    { label: 'Categoria', key: 'category' },
                    { label: 'Cor (Hex)', key: 'color' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>{f.label}</label>
                      <input className="input" style={{ fontSize: 13 }} value={(editSite as any)[f.key] || ''} onChange={e => setEditSite({ ...editSite, [f.key]: e.target.value })} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Descrição</label>
                    <textarea className="input" style={{ fontSize: 13, height: 80, resize: 'none', paddingTop: 12 }} value={editSite.description || ''} onChange={e => setEditSite({ ...editSite, description: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <input type="checkbox" checked={!!editSite.skip_sso} onChange={e => setEditSite({ ...editSite, skip_sso: e.target.checked })} style={{ cursor: 'pointer' }} id="edit-skip-sso" />
                    <label htmlFor="edit-skip-sso" style={{ fontSize: 11, fontWeight: 700, color: '#aaa', cursor: 'pointer' }}>Pular Login Automático (SSO)</label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveEditSite}><Check size={14} /> Salvar Alterações</button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditSite(null)}><X size={14} /> Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── USUÁRIOS ── */}
      {tab === 'users' && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: 18, fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' }}>
              Usuários & Permissões
            </h2>
            <button className="btn btn-primary" style={{ padding: '9px 16px', fontSize: 12 }} onClick={() => setShowAddUser(true)}>
              <Plus size={14} /> Novo Usuário
            </button>
          </div>

          {showAddUser && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: '#E10600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>+ Novo Usuário</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Nome Completo', key: 'name', placeholder: 'João Silva', type: 'text' },
                  { label: 'E-mail', key: 'email', placeholder: 'joao@own.com', type: 'email' },
                  { label: 'Senha Inicial', key: 'password', placeholder: '••••••••', type: 'password' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input className="input" type={f.type} style={{ fontSize: 13 }} placeholder={f.placeholder} value={(newUser as any)[f.key] || ''} onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Perfil</label>
                  <select className="input" style={{ fontSize: 13 }} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}>
                    <option value="operator">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '9px 16px' }} onClick={handleSaveNewUser}><Check size={13} /> Criar Usuário</button>
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowAddUser(false)}><X size={13} /> Cancelar</button>
              </div>
            </div>
          )}

          {/* Modal de edição de usuário */}
          {editUser && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: 20, fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase' }}>
                    Editar: {editUser.name}
                  </h3>
                  <button className="btn btn-ghost" onClick={() => setEditUser(null)} style={{ padding: '6px 10px' }}><X size={16} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Nome', key: 'name' },
                    { label: 'E-mail', key: 'email' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>{f.label}</label>
                      <input className="input" style={{ fontSize: 13 }} value={(editUser as any)[f.key] || ''} onChange={e => setEditUser({ ...editUser, [f.key]: e.target.value })} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Nova Senha (deixe em branco para manter)</label>
                    <input className="input" type="password" style={{ fontSize: 13 }} placeholder="••••••••" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Perfil</label>
                    <select className="input" style={{ fontSize: 13, color: '#fff' }} value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value as any })}>
                      <option value="operator">Operador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {/* Permissões por site com função */}
                  {editUser.role !== 'admin' && (
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
                        <Shield size={11} style={{ display: 'inline', marginRight: 4 }} />
                        Acesso aos Sites
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sites.map(site => {
                          const perm = userPerms.find(p => p.siteId === site.id);
                          const hasAccess = !!perm;
                          const availRoles = site.available_roles || ['operador'];
                          return (
                            <div key={site.id} style={{
                              borderRadius: 10,
                              background: hasAccess ? `${site.color}10` : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${hasAccess ? site.color + '40' : 'rgba(255,255,255,0.06)'}`,
                              transition: 'all 0.15s', overflow: 'hidden',
                            }}>
                              {/* Row de toggle */}
                              <div
                                onClick={() => toggleSiteAccess(site)}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}
                              >
                                <div style={{
                                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                  background: hasAccess ? site.color : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${hasAccess ? site.color : 'rgba(255,255,255,0.1)'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {hasAccess && <Check size={12} color="#fff" />}
                                </div>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${site.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: site.color, flexShrink: 0 }}>
                                  <SiteIcon name={site.icon} size={14} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{site.name}</div>
                                  <div style={{ fontSize: 11, color: '#555' }}>{site.category}</div>
                                </div>
                              </div>
                              {/* Seletor de função — visível apenas se tiver acesso */}
                              {hasAccess && availRoles.length > 1 && (
                                <div style={{
                                  borderTop: `1px solid ${site.color}20`,
                                  padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                                  background: `${site.color}06`,
                                }} onClick={e => e.stopPropagation()}>
                                  <Shield size={11} color={site.color} />
                                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: site.color }}>Função:</span>
                                  <select
                                    value={perm.role || availRoles[0]}
                                    onChange={e => updateSiteRole(site.id, e.target.value)}
                                    style={{
                                      background: 'rgba(0,0,0,0.4)', border: `1px solid ${site.color}30`,
                                      borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 600,
                                      padding: '3px 8px', cursor: 'pointer', outline: 'none',
                                      textTransform: 'capitalize',
                                    }}
                                  >
                                    {availRoles.map(r => (
                                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {editUser.role === 'admin' && (
                    <div style={{
                      padding: '12px 14px', borderRadius: 10,
                      background: 'rgba(225,6,0,0.06)', border: '1px solid rgba(225,6,0,0.15)',
                      fontSize: 12, color: '#E10600', display: 'flex', gap: 8, alignItems: 'center',
                    }}>
                      <Shield size={14} /> Administradores têm acesso a todos os sites automaticamente.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                  <button className="btn btn-primary" style={{ flex: 1, padding: '12px' }} onClick={handleSaveEditUser}><Check size={14} /> Salvar Alterações</button>
                  <button className="btn btn-ghost" style={{ padding: '12px 16px' }} onClick={() => setEditUser(null)}><X size={14} /></button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(user => {
              // Em tempo de loading as perms estão sendo renderizadas assíncronas do store. 
              // Melhor simplificar o Dashboard visual pro ADMIN list!
              return (
                <div key={user.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  background: 'rgba(255,255,255,0.02)', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: user.role === 'admin' ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800,
                    color: user.role === 'admin' ? '#E10600' : '#888',
                    border: `1px solid ${user.role === 'admin' ? 'rgba(225,6,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    {user.avatar_initials || user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {user.name}
                      {user.role === 'admin' && (
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 100, background: 'rgba(225,6,0,0.12)', color: '#E10600', border: '1px solid rgba(225,6,0,0.2)' }}>Admin</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{user.email || 'Supabase Auth User'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: '7px 10px', fontSize: 11 }} onClick={() => handleOpenEditUser(user)}>
                      <Edit2 size={12} /> Editar
                    </button>
                    {user.id !== session.userId && (
                      <button className="btn btn-danger" style={{ padding: '7px 10px', fontSize: 11 }} onClick={async () => { if (confirm(`Remover "${user.name}"?`)) { await deleteUser(user.id); await loadData(); } }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Principal ───────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [sites, setSites] = useState<AppSite[]>([]);
  const [isLoadingMain, setIsLoadingMain] = useState(true);
  const [activeCampaign, setActiveCampaign] = useState<{ id: string; name: string } | null>(null);
  const [closedSubscriptionsCount, setClosedSubscriptionsCount] = useState<number>(0);

  const loadCampaignStats = async () => {
    try {
      const { data: campaignData, error: campaignErr } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('status', 'active')
        .maybeSingle();

      if (campaignErr) {
        console.error("Error fetching active campaign:", campaignErr);
        return;
      }

      if (!campaignData) {
        setActiveCampaign(null);
        setClosedSubscriptionsCount(0);
        return;
      }

      setActiveCampaign(campaignData);

      const { data: recordsData, error: recordsErr } = await supabase
        .from('referral_records')
        .select('contacts')
        .eq('campaign_id', campaignData.id);

      if (recordsErr) {
        console.error("Error fetching referral records:", recordsErr);
        return;
      }

      let count = 0;
      if (recordsData) {
        recordsData.forEach(record => {
          const contacts = record.contacts;
          if (Array.isArray(contacts)) {
            contacts.forEach((c: any) => {
              if (c.status === 'converted' || c.subscriptionClosed) {
                count++;
              }
            });
          }
        });
      }
      setClosedSubscriptionsCount(count);
    } catch (err) {
      console.error("Error loading campaign stats:", err);
    }
  };

  const loadAllowedSites = async (s: LocalSession, isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) setIsLoadingMain(true);
    try {
      const allSites = await getSites() || [];
      if (s.userRole === 'admin') {
         setSites(allSites.filter(site => site.is_active));
      } else {
         const allowed = await getUserSites(s.userId) || [];
         setSites(allSites.filter(site => site.is_active && allowed.includes(site.id)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackgroundRefresh) setIsLoadingMain(false);
    }
  };

  useEffect(() => {
    const s = getLocalSession();
    if (s && s.expiresAt > Date.now()) {
      setSession(s);
      loadAllowedSites(s);
      loadCampaignStats();
    } else {
      setIsLoadingMain(false);
      clearLocalSession();
    }
  }, []);

  // --- Realtime Sync ---
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel('realtime-hub-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hub_sites' }, () => {
        loadAllowedSites(session, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hub_permissions' }, () => {
        loadAllowedSites(session, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hub_profiles' }, () => {
        loadAllowedSites(session, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        loadCampaignStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referral_records' }, () => {
        loadCampaignStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);


  const handleLogin = (s: LocalSession) => {
    setSession(s);
    loadAllowedSites(s);
    loadCampaignStats();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearLocalSession();
    setSession(null);
    setView('dashboard');
  };

  const handleAccessSite = async (site: AppSite) => {
    if (!session) return;
    try {
      const siteRole = await getUserSiteRole(session.userId, site.id);
      const relayUrl = buildRelayUrl(site.url, session, siteRole, site.skip_sso);
      window.open(relayUrl, '_blank', 'noopener');
    } catch (e) {
      console.error("Access error:", e);
      window.open(site.url, '_blank', 'noopener');
    }
  };

  const isAdmin = session?.userRole === 'admin';

  // Agrupar sites por categoria
  const grouped = useMemo(() => {
    const map: Record<string, AppSite[]> = {};
    sites.forEach(s => {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    });
    return map;
  }, [sites]);

  if (isLoadingMain) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#E10600' }}>Carregando dados da nuvem...</div>;
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative' }}>
      {/* Fundo com grid e glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(225,6,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(225,6,0,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      <div style={{
        position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(225,6,0,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6
            }}>
              <img src={Logo} alt="OWN" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: 20, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1 }}>
                OWN <span style={{ color: '#E10600' }}>HUB</span>
              </div>
              <div style={{ fontSize: 9, color: '#444', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Portal de Sistemas</div>
            </div>
          </div>

          {/* Nav central */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'dashboard', label: 'Portal', icon: LayoutGrid },
              ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: view === id ? 'rgba(225,6,0,0.12)' : 'transparent',
                  color: view === id ? '#E10600' : '#555',
                  transition: 'all 0.15s',
                  borderBottom: view === id ? '2px solid #E10600' : '2px solid transparent',
                }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </nav>

          {/* User + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{session.userName}</div>
              <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {session.userRole === 'admin' ? 'Administrador' : 'Operador'}
              </div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isAdmin ? 'rgba(225,6,0,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isAdmin ? 'rgba(225,6,0,0.2)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: isAdmin ? '#E10600' : '#888',
            }}>
              {session.userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <button className="btn btn-ghost" style={{ padding: '8px 10px' }} onClick={handleLogout} title="Sair do Hub">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>

        {/* ── DASHBOARD / PORTAL ── */}
        {view === 'dashboard' && (
          <div>
            {/* Boas vindas */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#E10600', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
                ● Bem-vindo de volta
              </div>
              <h1 style={{
                fontFamily: "'Titillium Web', sans-serif", fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase',
                letterSpacing: '-0.02em', lineHeight: 0.95, marginBottom: 14,
              }}>
                OWN <span style={{ color: '#E10600' }}>HUB.</span>
              </h1>
              <p style={{ color: '#555', fontSize: 15, maxWidth: 480 }}>
                Selecione um sistema abaixo para acessar. Seu login será automaticamente transmitido.
              </p>
            </div>

            {/* Faixa marquee */}
            {activeCampaign && (
              <div style={{
                overflow: 'hidden', background: '#E10600',
                padding: '10px 0', marginBottom: 48,
                borderTop: '3px solid #000', borderBottom: '3px solid #000',
                marginLeft: -24, marginRight: -24,
              }}>
                <div className="animate-marquee">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 28, paddingRight: 28 }}>
                      <span style={{ fontFamily: "'Titillium Web', sans-serif", fontWeight: 900, fontStyle: 'italic', fontSize: 20, textTransform: 'uppercase', color: '#000', whiteSpace: 'nowrap' }}>
                        Campanha: {activeCampaign.name}
                      </span>
                      <Star size={14} color="#000" />
                      <span style={{ fontFamily: "'Titillium Web', sans-serif", fontWeight: 900, fontStyle: 'italic', fontSize: 20, textTransform: 'uppercase', color: '#000', whiteSpace: 'nowrap' }}>
                        {closedSubscriptionsCount} Assinaturas Vendidas
                      </span>
                      <Zap size={14} color="#000" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sites por categoria */}
            {sites.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 24px',
                background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: 20,
              }}>
                <Lock size={40} color="#333" style={{ marginBottom: 16 }} />
                <div style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: 22, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#333', marginBottom: 8 }}>
                  Nenhum Sistema Disponível
                </div>
                <p style={{ color: '#444', fontSize: 13 }}>Aguarde o administrador liberar seu acesso.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([category, catSites]) => (
                <div key={category} style={{ marginBottom: 48 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 4, height: 20, background: '#E10600', borderRadius: 2 }} />
                    <h2 style={{ fontFamily: "'Titillium Web', sans-serif", fontSize: 16, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#777' }}>
                      {category}
                    </h2>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ fontSize: 11, color: '#444', fontWeight: 600 }}>{catSites.length} sistema{catSites.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}>
                    {catSites.map(site => (
                      <SiteCard key={site.id} site={site} onAccess={handleAccessSite} />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Rodapé info */}
            <div style={{
              marginTop: 48, padding: '20px 24px', borderRadius: 14,
              background: 'rgba(225,6,0,0.04)', border: '1px solid rgba(225,6,0,0.1)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Shield size={18} color="#E10600" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#E10600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sessão Segura Ativa</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                  Seu token de acesso é válido por 8 horas. Ao clicar em um sistema, o login é transmitido automaticamente.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ADMIN ── */}
        {view === 'admin' && isAdmin && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#E10600', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
                ● Painel Administrativo
              </div>
              <h1 style={{
                fontFamily: "'Titillium Web', sans-serif", fontSize: 40,
                fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em',
              }}>
                GESTÃO DO <span style={{ color: '#E10600' }}>HUB.</span>
              </h1>
            </div>
            <AdminPanel session={session} onRefresh={() => loadAllowedSites(session, true)} />
          </div>
        )}
      </main>
    </div>
  );
}
