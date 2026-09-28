# Shopee Pack WPP Messenger

## Início rápido

1. Copie `.env.example` para `.env` e preencha `SHOPEE_APP_ID`, `SHOPEE_SECRET`, `EVOLUTION_API_KEY`, `ADMIN_SESSION_SECRET` e `NGROK_AUTHTOKEN`. `GEMINI_API_KEY` é opcional; se usá-la, configure `GEMINI_MODEL` com um modelo disponível para sua chave. Se já tiver um `.env`, acrescente apenas as variáveis ausentes; não substitua suas credenciais. Antes da primeira inicialização do banco, configure também `EVOLUTION_DB_PASSWORD` com uma senha sem caracteres reservados de URL (como `@`, `:`, `/` ou `#`). Se não configurar, o Compose usa a senha de demonstração `local-dev-only-password`. Alterar a variável depois que o volume PostgreSQL foi criado não troca automaticamente a senha do usuário no banco.
2. Execute `docker compose up -d` para iniciar n8n, ngrok, PostgreSQL e Evolution API. O PostgreSQL é necessário para a Evolution API v2 e não publica porta para fora da rede do Compose. Confira com `docker compose ps` e, se necessário, `docker compose logs --tail=80 evolution-api`.
3. No Evolution API, crie a instância com o mesmo nome de `EVOLUTION_INSTANCE` (padrão: `shopee-messenger`). Abra o painel (`http://localhost:5173`) e use **Atualizar QR Code**.
4. Na raiz do projeto, execute `npm run dev`. Na primeira execução, o script prepara o ambiente Python e instala as dependências do painel, se necessário. Nesta máquina, ele prioriza `C:\Users\meuem\AppData\Local\Programs\Python\Python312\python.exe`; a variável `PYTHON_BIN` permite escolher outro executável. Depois inicia o backend em `http://localhost:8000` e o painel em `http://localhost:5173`. Pressione Ctrl+C para encerrar ambos.

## Seleção de produto

O backend consulta `productOfferV2` da API GraphQL da Shopee, assina o corpo exato com SHA-256 e só trabalha com ofertas que retornem link de afiliado. As estratégias são determinísticas: menor preço, maior comissão e maior potencial (vendas, desconto, comissão e preço). O Gemini, quando configurado, apenas melhora a redação; não decide o produto.

## n8n e ngrok

O ngrok autentica o agente com `NGROK_AUTHTOKEN`, obtido no painel da sua conta ngrok. Esse token não é a API key usada para administrar a API do ngrok: esta aplicação só precisa do authtoken para abrir o túnel. Importe `n8n/workflows/send-offer-now.json` no n8n. Substitua o token do cabeçalho por um token gerado no login. O workflow funciona como demonstração manual; a agenda configurada no painel é aplicada pelo backend. Para expor webhooks, copie a URL exibida em `http://localhost:4040` para `N8N_WEBHOOK_URL` e reinicie o serviço n8n.

## Segurança e uso responsável

Use somente o grupo e os números que possuem consentimento. Não versione `.env`; altere a senha padrão e o segredo da sessão antes de qualquer uso fora do ambiente local. Respeite os termos da Shopee e do WhatsApp/Evolution API.
