# Chatbot Barbearia

Chatbot de atendimento automatizado para barbearia, integrado ao WhatsApp e com respostas geradas por IA. O cliente manda uma mensagem no WhatsApp, a IA entende o contexto (horários, serviços, agendamento) e responde como um atendente real da barbearia.

> Projeto desenvolvido como estudo prático de integração entre APIs de IA (Anthropic Claude) e mensageria (Z-API / WhatsApp), usando TypeScript e Node.js.

---

## Para recrutadores

Este projeto demonstra, na prática:

- **Integração com LLMs em produção** — uso do SDK oficial da Anthropic (Claude) com *system prompt* customizado para restringir o escopo do assistente ao domínio da barbearia.
- **Integração com API de terceiros** — webhook bidirecional com a Z-API para receber e enviar mensagens no WhatsApp.
- **API REST com Express 5** — endpoints tipados, tratamento de erros e validação de payload.
- **TypeScript estrito** — `strict: true` no `tsconfig`, tipagem em todas as funções e payloads.
- **Gestão de estado conversacional** — histórico por número de telefone com janela deslizante para controle de custo de tokens.
- **Boas práticas** — variáveis sensíveis em `.env`, separação de responsabilidades (`index.ts` para HTTP, `chat.ts` para IA), filtros para mensagens de grupo e mensagens do próprio bot.

### Principais pontos técnicos

| Tema | Implementação |
|---|---|
| Modelo de IA | `claude-haiku-4-5` — escolhido por custo/latência para atendimento em tempo real |
| Contexto do usuário | `Map<telefone, histórico>` em memória, com janela das últimas 10 mensagens |
| Webhook WhatsApp | Filtra mensagens próprias (`fromMe`) e de grupos (`isGroup`) antes de processar |
| Persona do bot | System prompt fixo com horários, endereço e tabela de preços |
| Fallback | Quando o bot não sabe responder, é instruído a dizer que vai verificar com a equipe |

---

## Stack

- **Node.js** + **TypeScript**
- **Express 5** — servidor HTTP
- **Anthropic SDK** (`@anthropic-ai/sdk`) — modelo Claude Haiku 4.5
- **Z-API** — gateway para WhatsApp
- **dotenv** — gerenciamento de variáveis de ambiente
- **nodemon** + **ts-node** — hot reload em desenvolvimento

---

## Arquitetura

```
WhatsApp do cliente
       │
       ▼
   Z-API (gateway)
       │  POST /webhook
       ▼
  Express (index.ts) ──► filtros (grupo / fromMe)
       │
       ▼
   chat.ts ──► Anthropic Claude ──► resposta
       │
       ▼
   Z-API send-text ──► WhatsApp do cliente
```

Fluxo resumido:

1. Cliente envia mensagem no WhatsApp da barbearia.
2. Z-API recebe e faz `POST /webhook` para a aplicação.
3. A aplicação recupera (ou cria) o histórico daquele telefone.
4. Envia o histórico + system prompt para o Claude.
5. Recebe a resposta, salva no histórico e devolve pela Z-API.

---

## Endpoints

### `GET /`
Health check.
```json
{ "status": "ok", "message": "Chatbot Barbearia rodando!" }
```

### `POST /chat`
Endpoint de teste direto (sem WhatsApp).
```json
// request
{ "telefone": "5519999999999", "mensagem": "Qual o horário?" }

// response
{ "resposta": "Funcionamos de segunda a sábado, das 9h às 19h..." }
```

### `POST /webhook`
Consumido pela Z-API quando uma mensagem chega no WhatsApp. Responde `200` em todos os casos (inclusive ignorados) para não gerar retry do gateway.

---

## Como rodar localmente

```bash
# 1. Instale as dependências
npm install

# 2. Crie um arquivo .env na raiz
cp .env.example .env   # ou crie manualmente com as variáveis abaixo

# 3. Rode em modo dev (hot reload)
npm run dev

# 4. Build + produção
npm run build
npm start
```

### Variáveis de ambiente

```env
ANTHROPIC_API_KEY=sk-ant-...
ZAPI_URL=https://api.z-api.io
ZAPI_INSTANCE_ID=...
ZAPI_TOKEN=...
ZAPI_CLIENT_TOKEN=...
PORT=3000
```

---

## Estrutura do projeto

```
chatbot-barbearia/
├── src/
│   ├── index.ts      # servidor Express, rotas e webhook Z-API
│   └── chat.ts       # integração com Claude e gestão de histórico
├── package.json
├── tsconfig.json
└── README.md
```

---

## Possíveis evoluções

- Persistência do histórico em banco (Redis / Postgres) — hoje está em memória e some ao reiniciar.
- Integração com agenda real (Google Calendar) para confirmar horários de fato.
- Tool use do Claude para consultar disponibilidade e criar agendamentos.
- Testes automatizados (Jest) para os fluxos críticos.
- Observabilidade — logs estruturados e métricas de uso/custo da API.

---

## Autor

**William** — desenvolvedor em formação, focado em backend, TypeScript e IA aplicada.
