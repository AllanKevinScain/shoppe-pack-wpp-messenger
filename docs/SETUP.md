# Shopee Pack WPP Messenger

## Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ e npm
- Python 3.11+
- `make` (opcional, mas recomendado)

## Início rápido

1. Execute `make env` para criar o `.env` a partir do `.env.example` e preencha `SHOPEE_APP_ID`, `SHOPEE_SECRET`, `EVOLUTION_API_KEY`, `ADMIN_SESSION_SECRET` e `NGROK_AUTHTOKEN`. `GEMINI_API_KEY` é opcional. Se já tiver um `.env`, o comando não o sobrescreve; acrescente apenas as variáveis ausentes.
2. Execute `make setup` para criar o ambiente Python (`backend/.venv`) e instalar as dependências do painel.
3. Execute `make up` para iniciar n8n, ngrok e Evolution API.
4. Execute `make dev` para iniciar o backend em `http://localhost:8000` e o painel em `http://localhost:5173`. Pressione Ctrl+C para encerrar ambos.
5. No Evolution API, crie a instância com o mesmo nome de `EVOLUTION_INSTANCE` (padrão: `shopee-messenger`). Abra o painel e use **Atualizar QR Code** para conectar o WhatsApp.

Sem `make`, os equivalentes são `cp .env.example .env`, `docker compose up -d` e `npm run dev` (este último também prepara o ambiente Python e o painel na primeira execução). Para usar outro executável Python, defina `PYTHON_BIN` (ex.: `make setup PYTHON_BIN=python3.12` ou `PYTHON_BIN=... npm run dev`).

## Comandos do Makefile

| Comando | Descrição |
| --- | --- |
| `make help` | Lista os comandos disponíveis |
| `make env` | Cria o `.env` a partir do `.env.example` (não sobrescreve) |
| `make setup` | Prepara `.env`, ambiente Python e dependências do painel |
| `make up` / `make down` | Sobe / para os containers (n8n, ngrok, Evolution API) |
| `make restart` | Reinicia os containers |
| `make logs` / `make ps` | Logs e status dos containers |
| `make dev` | Inicia backend e painel juntos |
| `make backend` | Inicia apenas o backend (com recarga automática) |
| `make admin` | Inicia apenas o painel |
| `make check` / `make build` | Checagem de tipos / build do painel |
| `make clean` | Remove `backend/.venv`, `admin/node_modules` e `admin/dist` |

## Serviços e portas

| Serviço | URL |
| --- | --- |
| Painel administrativo | `http://localhost:5173` |
| Backend (FastAPI) | `http://localhost:8000` |
| n8n | `http://localhost:5678` |
| Evolution API | `http://localhost:8080` |
| Painel do ngrok | `http://localhost:4040` |

## Seleção de produto

O backend consulta `productOfferV2` da API GraphQL da Shopee, assina o corpo exato com SHA-256 e só trabalha com ofertas que retornem link de afiliado. As estratégias são determinísticas: menor preço, maior comissão e maior potencial (vendas, desconto, comissão e preço). O Gemini, quando configurado, apenas melhora a redação; não decide o produto.

## n8n e ngrok

O ngrok autentica o agente com `NGROK_AUTHTOKEN`, obtido no painel da sua conta ngrok. Esse token não é a API key usada para administrar a API do ngrok: esta aplicação só precisa do authtoken para abrir o túnel. Importe `n8n/workflows/send-offer-now.json` no n8n. Substitua o token do cabeçalho por um token gerado no login. O workflow funciona como demonstração manual; a agenda configurada no painel é aplicada pelo backend. Para expor webhooks, copie a URL exibida em `http://localhost:4040` para `N8N_WEBHOOK_URL` e execute `make restart`.

## Segurança e uso responsável

Use somente o grupo e os números que possuem consentimento. Não versione `.env`; altere a senha padrão e o segredo da sessão antes de qualquer uso fora do ambiente local. Respeite os termos da Shopee e do WhatsApp/Evolution API.
