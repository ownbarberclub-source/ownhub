# OWN HUB

Portal central de acesso aos sistemas OWN Barber Club.

## Credenciais Padrão

| Campo | Valor |
|-------|-------|
| E-mail | `admin@ownbarberclub.com.br` |
| Senha | `own2024` |

> ⚠️ **Altere a senha padrão pelo Painel Admin após o primeiro acesso!**

## Configuração

Opcionalmente crie um `.env` com credenciais Supabase:
```
VITE_SUPABASE_URL=https://sua-url.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave
```

No painel Admin → Usuários, crie as contas dos operadores e defina quais sites cada um pode acessar.

## Como Proteger um Sub-Site

Copie o arquivo `public/access-control.js` para cada sub-site.

### Sites HTML puro
```html
<script src="/access-control.js"></script>
```

### Sites React/Vite (main.tsx)
```ts
import './access-control';
```

## Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
```
