.DEFAULT_GOAL := help

PYTHON_BIN ?= python3
VENV       := backend/.venv
VENV_PY    := $(VENV)/bin/python

.PHONY: help env setup install-backend install-admin up down restart logs ps dev backend admin check build clean

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

env: ## Cria o .env a partir do .env.example (não sobrescreve)
	@if [ -f .env ]; then echo ".env já existe; nada a fazer."; else cp .env.example .env && echo ".env criado. Preencha as credenciais."; fi

setup: env install-backend install-admin ## Prepara o ambiente completo (.env, Python e painel)

install-backend: ## Cria o venv e instala as dependências Python
	@test -x $(VENV_PY) || $(PYTHON_BIN) -m venv $(VENV)
	$(VENV_PY) -m pip install -r backend/requirements.txt

install-admin: ## Instala as dependências do painel
	cd admin && npm ci

up: ## Sobe n8n, ngrok e Evolution API (Docker)
	docker compose up -d

down: ## Para os containers
	docker compose down

restart: ## Reinicia os containers
	docker compose restart

logs: ## Acompanha os logs dos containers
	docker compose logs -f

ps: ## Mostra o status dos containers
	docker compose ps

dev: ## Inicia backend (8000) e painel (5173) juntos
	npm run dev

backend: ## Inicia apenas o backend (FastAPI) em http://localhost:8000
	cd backend && .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

admin: ## Inicia apenas o painel (Vite) em http://localhost:5173
	cd admin && npx vite --host 127.0.0.1 --port 5173 --strictPort

check: ## Verifica os tipos do painel (TypeScript)
	cd admin && npm run check

build: ## Gera o build de produção do painel
	cd admin && npm run build

clean: ## Remove venv, node_modules e build do painel
	rm -rf $(VENV) admin/node_modules admin/dist
