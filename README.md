# CFFC Admin Hub

Painel de administração para gestão de denúncias, vídeos em análise, validação de profissionais e utilizadores.

## Funcionalidades

- **Login** — Acesso restrito (mock; qualquer email/senha para desenvolvimento).
- **Denúncias** — Listagem e gestão de denúncias de conteúdo e perfis (remover conteúdo, remover denúncia, bloquear utilizador).
- **Vídeos em Análise** — Aprovar ou rejeitar vídeos enviados por atletas.
- **Validação de Profissionais** — Aprovar ou rejeitar pedidos de validação de profissionais (documentos, CRM/CREF, etc.).
- **Gestão de Utilizadores** — Listar utilizadores, bloquear/desbloquear, remover validação, criar administradores.

## Stack

- **Runtime / build:** Vite, React 18, TypeScript
- **UI:** shadcn/ui, Tailwind CSS, Radix UI
- **Estado:** Zustand (estado global), TanStack Query v5 (estado de servidor / listagens)
- **Roteamento:** React Router v6

## Pré-requisitos

- [Bun](https://bun.sh) (recomendado) ou Node.js 18+

## Como rodar

```bash
# Instalar dependências
bun install
# ou: npm install

# Servidor de desenvolvimento (porta 8080)
bun run dev
# ou: npm run dev

# Build de produção
bun run build

# Pré-visualizar build
bun run preview
```

## Estrutura do projeto

- `src/pages/` — Páginas da aplicação (Container/Presentational por pasta).
- `src/components/` — Componentes reutilizáveis e UI (shadcn).
- `src/stores/` — Stores Zustand (ex.: auth).
- `src/lib/` — Utilitários, queryClient, queryKeys.
- `src/data/` — Dados mock e funções de fetch simuladas (para substituir por API no futuro).
- `src/layouts/` — Layouts (ex.: AdminLayout com sidebar).
- `src/hooks/` — Hooks partilhados.

## Scripts

| Script        | Descrição                    |
| ------------- | ---------------------------- |
| `bun run dev` | Servidor de desenvolvimento  |
| `bun run build` | Build de produção         |
| `bun run build:dev` | Build em modo development |
| `bun run preview` | Servir build localmente   |
| `bun run lint` | Executar ESLint            |
