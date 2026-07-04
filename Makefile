.PHONY: all run build test clean stop logs

all: build run

run:
	docker-compose up -d

build:
	docker-compose build

test:
	cd toutiao_backend && uv run pytest tests/ -v

stop:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	rm -rf toutiao_backend/.venv
	rm -rf 03-前端项目代码/xwzx-news/node_modules

backend-dev:
	cd toutiao_backend && uv run uvicorn main:app --host 0.0.0.0 --port 8888 --reload

frontend-dev:
	cd 03-前端项目代码/xwzx-news && npm run dev

lint-backend:
	cd toutiao_backend && uv run python -m flake8 .

lint-frontend:
	cd 03-前端项目代码/xwzx-news && npm run lint

install-backend:
	cd toutiao_backend && uv sync

install-frontend:
	cd 03-前端项目代码/xwzx-news && npm install