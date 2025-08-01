# Estágio 1: Build
# Usamos uma imagem Node.js para instalar dependências e compilar o projeto
FROM node:20-alpine AS build

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm install

# Copia todo o resto do código da aplicação
COPY . .

# Executa o script de build definido no seu package.json
# Isso irá transpilar o backend e gerar os arquivos estáticos do frontend
RUN npm run build

# Estágio 2: Produção
# Usamos uma imagem menor para a versão final, otimizando o tamanho
FROM node:20-alpine

WORKDIR /app

# Copia apenas as dependências de produção do estágio de build
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

# Copia os artefatos de build (código transpilado do servidor e cliente)
COPY --from=build /app/dist ./dist

# Expõe a porta que a aplicação usa, conforme definido em server/index.ts
EXPOSE 5000

# Comando para iniciar a aplicação em modo de produção
CMD ["npm", "start"]