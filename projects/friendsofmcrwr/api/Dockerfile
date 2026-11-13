# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Run stage ---
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/data ./dist/data
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
RUN addgroup -g 1001 appuser && adduser -D -u 1001 -G appuser appuser
USER appuser
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/server.js"]
