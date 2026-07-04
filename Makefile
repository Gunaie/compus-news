.PHONY: all run build test clean stop logs

all: build run

run:
	docker-compose up -d

build:
	docker-compose build

test:
	cd backend && uv run pytest tests/ -v

stop:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	rm -rf backend/.venv
	rm -rf frontend/node_modules

backend-dev:
	cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8888 --reload

frontend-dev:
	cd frontend && npm run dev

lint-backend:
	cd backend && uv run python -m flake8 .

lint-frontend:
	cd frontend && npm run lint

install-backend:
	cd backend && uv sync

install-frontend:
	cd frontend && npm install