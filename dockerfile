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
# Copia o frontend compilado
COPY --from=build /app/dist/public ./dist/public
COPY drizzle.config.ts .
COPY shared shared
COPY server/create-admin.ts server/create-admin.ts

# Roda a migração antes de iniciar a aplicação, fornecendo a DATABASE_URL
RUN DATABASE_URL=postgresql://postgres:mysecretpassword@db:5432/pointtrack_db npm run db:push

# Cria o usuário admin após a migração
RUN DATABASE_URL=postgresql://postgres:mysecretpassword@db:5432/pointtrack_db npm run create:admin

EXPOSE 5000
CMD ["npm", "start"]