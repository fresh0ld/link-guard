# Discord Link Guard

Bot do Discord para **analisar links enviados no chat**, estimar uma **pontuação de risco** com heurísticas e reputação, registrar **logs em JSON** e expor um **painel web (React)** com estatísticas.

Autor: **fr3sh**

## Visão geral

O bot observa mensagens do servidor, extrai URLs e executa uma análise simples (e extensível) para identificar possíveis golpes (ex.: “free nitro”, encurtadores suspeitos, typosquatting). Se a pontuação passar de um limite, ele pode alertar em um canal de moderação.

O backend também expõe uma API (`express`) e o frontend (React + Vite) mostra um painel com métricas e a lista de eventos mais recentes.

## Recursos

- Analisa links em mensagens (`messageCreate`)
- Heurísticas de golpe (palavras-chave, encurtadores, punycode, typosquatting, TLD suspeito)
- Bloqueio/timeout por domínio (anti-spam) para reduzir flood de links repetidos
- Cache com TTL para DNS e expansão de URL
- Reputação:
  - URLhaus (sem chave)
  - VirusTotal (opcional via API key)
- Resolve domínio -> IP (DNS)
- Pontuação de risco (0-100) + veredito (`low`/`medium`/`high`)
- Logs em `backend/data/events.json` (mantém os últimos 5000 eventos)
- API HTTP:
  - `GET /api/stats`
  - `GET /api/events?limit=...`
  - `GET /health`
- Painel web (React) consumindo a API

## Estrutura do projeto

```text
backend/   # bot + API + analisadores
frontend/  # painel web (React + Vite)
```

## Requisitos

- Node.js 18+

## Configuração do Bot (Discord Developer Portal)

1. Crie uma aplicação em:
   - https://discord.com/developers/applications
2. Vá em **Bot** e gere o token
3. Em **Privileged Gateway Intents**, ative:
   - **MESSAGE CONTENT INTENT**
4. Convide o bot para o servidor usando OAuth2 URL Generator:
   - Scopes: `bot`
   - Permissões mínimas: ler/enviar mensagens no(s) canal(is) desejado(s)

## Backend (Bot + API)

### 1) Instalar dependências

Execute na pasta `backend/`:

```bash
npm install
```

### 2) Variáveis de ambiente

Crie `backend/.env` baseado em `backend/.env.example`.

Campos principais:

- `DISCORD_TOKEN`: token do bot
- `PORT`: porta do backend (default `3001`)
- `CORS_ORIGIN`: origem do frontend (ex.: `http://localhost:5173`)
- `RISK_THRESHOLD`: pontuação mínima para alertar (default `60`)
- `MOD_ALERT_CHANNEL_ID`: (opcional) canal para alertas

Anti-spam por domínio:

- `DOMAIN_WINDOW_MS`: janela do rate-limit (ms)
- `DOMAIN_MAX_IN_WINDOW`: máximo de links analisados por domínio por janela
- `DOMAIN_COOLDOWN_MS`: tempo de bloqueio do domínio após estourar o limite (ms)

Cache:

- `DNS_CACHE_TTL_MS`: TTL do cache de DNS (ms)
- `EXPAND_CACHE_TTL_MS`: TTL do cache de expansão de URL (ms)

Reputação:

- `REPUTATION_ENABLED`: `1` habilita, `0` desabilita
- `VIRUSTOTAL_API_KEY`: (opcional) chave de API do VirusTotal

### 3) Rodar

```bash
npm run start
```

API em `http://localhost:3001`.

## Frontend (Painel)

### 1) Instalar dependências

Execute na pasta `frontend/`:

```bash
npm install
```

### 2) Variáveis de ambiente

Crie `frontend/.env` baseado em `frontend/.env.example`.

- `VITE_API_BASE=http://localhost:3001`

### 3) Rodar

```bash
npm run dev
```

Abra `http://localhost:5173`.

