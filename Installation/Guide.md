# To get running
1. Generate a session secret and create .env:


cd scaffold
cp .env.example .env
# Replace SESSION_SECRET with:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
2. Install new API packages (inside Docker on first build, or locally):


cd api && npm install
3. Start dev stack:


docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
4. Open http://localhost:3000 — you'll be redirected to /login. Register an account, then land on the dashboard.