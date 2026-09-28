# Shopee Pack WPP Messenger

## Início rápido

1. Copie `.env.example` para `.env` e preencha `SHOPEE_APP_ID`, `SHOPEE_SECRET`, `EVOLUTION_API_KEY`, `ADMIN_SESSION_SECRET`, `NGROK_AUTHTOKEN` e `N8N_DISPATCH_TOKEN` (um token longo e aleatório, diferente dos demais). `GEMINI_API_KEY` é opcional; se usá-la, configure `GEMINI_MODEL` com um modelo disponível para sua chave. Se já tiver um `.env`, acrescente apenas as variáveis ausentes; não substitua suas credenciais. Antes da primeira inicialização do banco, configure também `EVOLUTION_DB_PASSWORD` com uma senha sem caracteres reservados de URL (como `@`, `:`, `/` ou `#`). Se não configurar, o Compose usa a senha de demonstração `local-dev-only-password`. Alterar a variável depois que o volume PostgreSQL foi criado não troca automaticamente a senha do usuário no banco.
2. Execute `docker compose up -d` para iniciar n8n, ngrok, PostgreSQL e Evolution API. O PostgreSQL é necessário para a Evolution API v2 e não publica porta para fora da rede do Compose. Confira com `docker compose ps` e, se necessário, `docker compose logs --tail=80 evolution-api`.
3. No Evolution API, crie a instância com o mesmo nome de `EVOLUTION_INSTANCE` (padrão: `shopee-messenger`). Abra o painel (`http://localhost:5173`) e use **Atualizar QR Code**.
4. Na raiz do projeto, execute `npm run dev`. Na primeira execução, o script prepara o ambiente Python e instala as dependências do painel, se necessário. Nesta máquina, ele prioriza `C:\Users\meuem\AppData\Local\Programs\Python\Python312\python.exe`; a variável `PYTHON_BIN` permite escolher outro executável. Depois inicia o backend em `http://localhost:8000` e o painel em `http://localhost:5173`. Mantenha backend e n8n em execução para os envios automáticos; Ctrl+C encerra o backend e o painel.

## Seleção de produto

O backend consulta `productOfferV2` da API GraphQL da Shopee, assina o corpo exato com SHA-256 e só trabalha com ofertas que retornem link de afiliado. As estratégias são determinísticas: menor preço, maior comissão e maior potencial (vendas, desconto, comissão e preço). O Gemini, quando configurado, apenas melhora a redação; não decide o produto.

## n8n e ngrok

O n8n é responsável pelo agendamento. Importe `n8n/workflows/send-offer-automatically.json` em `http://localhost:5678`. No nó **Enviar se estiver na hora**, crie/selecione uma credencial **Header Auth** com nome de cabeçalho `X-Dispatch-Token` e valor igual a `N8N_DISPATCH_TOKEN` do `.env`. Salve e **publique/ative** o workflow uma única vez. Ele verifica a cada minuto se o intervalo definido no painel venceu; a API faz o envio somente quando estiver na hora. O primeiro intervalo começa quando o painel salva as configurações ou quando o workflow executa pela primeira vez. Envios manuais também reiniciam a contagem. Não configure outro workflow de envio periódico, para evitar duplicatas.

O ngrok autentica com `NGROK_AUTHTOKEN` e expõe o n8n; ele não é necessário para a agenda local. Se for expor webhooks, atualize `N8N_WEBHOOK_URL` com a URL exibida em `http://localhost:4040` e reinicie o n8n. Não exponha o token de automação nem importe workflows de origem desconhecida.

## Acompanhar e diagnosticar envios

Abra **Envios** no painel. A página mostra o último contato do n8n, o próximo horário previsto, o último envio aceito pela Evolution API e as tentativas recentes (manuais e automáticas). O histórico começa depois que esta versão do backend é iniciada; tentativas antigas não podem ser reconstruídas. A página atualiza a cada 15 segundos e registra no máximo as 30 tentativas mais recentes na visualização. A aceitação pela Evolution API não comprova entrega no WhatsApp.

Se aparecer **Sem contato recente**, confira se backend e n8n estão ligados e abra **Executions** no workflow do n8n. `ECONNREFUSED` na porta 8000 indica que o n8n não conseguiu alcançar o backend; HTTP 401 indica que a credencial `X-Dispatch-Token` não corresponde ao `.env`; HTTP 500 indica uma falha no backend. Quando a chamada chega à API, a página **Envios** registra a etapa e o erro sem exibir chaves. Após mudar o backend, reinicie `npm run dev` para carregar a versão nova.

## Segurança e uso responsável

Use somente o grupo e os números que possuem consentimento. Não versione `.env`; altere a senha padrão e o segredo da sessão antes de qualquer uso fora do ambiente local. Respeite os termos da Shopee e do WhatsApp/Evolution API.
