# syntax=docker/dockerfile:1
FROM node:20-alpine

# Ambiente e diretório
ENV NODE_ENV=production
WORKDIR /app

# Instala só deps de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o código
COPY server.js ./server.js
COPY src ./src

# Porta padrão do seu server (pode sobrescrever em runtime)
ENV PORT=62143
EXPOSE 62143

# Executa
CMD ["node", "server.js"]
