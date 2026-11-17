.PHONY: all run deploy build test test-backend test-e2e test-perf smoke clean stop logs ps backend-dev frontend-dev install-backend install-frontend

all: build run

run:
	docker compose up -d

deploy:
	docker compose up -d --build
	node scripts/smoke.mjs

build:
	docker compose build

test: test-backend test-e2e

test-backend:
	cd backend && uv run pytest tests/ -v

test-e2e:
	cd frontend && npm run test:e2e

test-perf:
	cd frontend && npm run test:perf

smoke:
	node scripts/smoke.mjs

stop:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

clean:
	docker compose down -v
	rm -rf backend/.venv
	rm -rf frontend/node_modules

backend-dev:
	cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8888 --reload

frontend-dev:
	cd frontend && npm run dev

install-backend:
	cd backend && uv sync

install-frontend:
	cd frontend && npm ci
