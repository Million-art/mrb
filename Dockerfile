# Frontend Dockerfile (React/Vite)
FROM node:18 as build

WORKDIR /app

COPY mini_app/package*.json ./
COPY mini_app/.env .env
RUN npm install

COPY mini_app/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
