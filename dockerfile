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
# Remove --omit=dev para instalar TODAS as dependências, incluindo o Vite
RUN npm install --legacy-peer-deps
# Copia o backend compilado
COPY --from=build /app/dist ./dist
# Copia o frontend compilado
COPY --from=build /app/dist/public ./dist/public
EXPOSE 5000
CMD ["npm", "start"]
