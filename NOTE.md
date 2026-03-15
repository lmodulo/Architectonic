
# TERMINAL
rebuild restart frontend
docker compose build web; docker compose up -d web

rebuild restart API
docker compose -f docker-compose.yml -f docker-compose.dev.yml build api
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api

# PROMPT
session end
update the CLAUDE.md file with necessary context.