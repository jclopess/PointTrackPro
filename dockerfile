# Estágio 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Instala todas as dependências para o build
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Estágio 2: Produção
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
# Instala as dependências de produção e as dev dependencies para o drizzle-kit
RUN npm install --legacy-peer-deps

# Copia o backend compilado
COPY --from=build /app/dist ./dist
# Copia todos os arquivos estáticos do front-end, incluindo o CSS, a partir da pasta de build do Vite
COPY --from=build /app/dist/public ./dist/public
# Copia o frontend compilado
COPY tsconfig.json .
COPY shared shared
COPY server server
COPY drizzle.config.ts .

# Roda a migração antes de iniciar a aplicação, fornecendo a DATABASE_URL
RUN DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/pointtrack_db npm run db:push:docker

# Cria o usuário admin após a migração
RUN DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/pointtrack_db npm run create:admin:docker

EXPOSE 5000
CMD ["npm", "start"]