# Shopee Pack WPP Messenger

Trabalho da disciplina de **Inteligência Artificial** (FACCAT).

O projeto busca ofertas na API de afiliados da **Shopee**, seleciona produtos por estratégias determinísticas (menor preço, maior comissão ou maior potencial) e envia as ofertas para um grupo de WhatsApp via Evolution API. O **Gemini** é usado opcionalmente para melhorar a redação das mensagens, e o **n8n** orquestra fluxos de automação.

**Stack:** FastAPI (backend) · React + Vite (painel) · n8n · Evolution API · ngrok · Docker

## Como rodar

```bash
make env     # cria o .env (preencha as credenciais)
make setup   # instala dependências
make up      # sobe n8n, ngrok e Evolution API
make dev     # inicia backend e painel
```

Instruções completas em [docs/SETUP.md](docs/SETUP.md).
