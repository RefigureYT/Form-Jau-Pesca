#!/bin/bash
set -euo pipefail

# ========= Configs (pode sobrescrever via env) =========
IP="${IP:-192.168.15.121}"           # Registry privado
REG_PORT="${REG_PORT:-5000}"         # Porta do registry
NAME="${NAME:-form-jau-pesca}"       # Nome da imagem
VERSION="${VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}"
IMAGE_NAME="${IP}:${REG_PORT}/${NAME}:${VERSION}"

# Porta do app: lê do .env (PORT=...) ou usa default do server.js (62143)
APP_PORT="${APP_PORT:-$(
  (grep -E '^[[:space:]]*PORT=' .env 2>/dev/null | tail -n1 | cut -d= -f2 | xargs) || true
)}"
APP_PORT="${APP_PORT:-62143}"

# ========= Guardas anti-debug =========
if [[ "${ALLOW_DEBUG:-0}" != "1" ]]; then
  echo "🔍 Verificando indicadores de DEBUG em arquivos de deploy..."

  # 1) Evitar 'nodemon' em Dockerfile/compose
  if grep -RInE 'nodemon' . --include='Dockerfile' --include='docker-compose*.yml' --include='docker-compose*.yaml' 2>/dev/null; then
    echo "❌ Abortado: 'nodemon' encontrado em arquivos de deploy." ; exit 21
  fi

  # 2) Flags de inspeção do Node (--inspect / --inspect-brk)
  if grep -RInE -- '--inspect(-brk)?' . --include='Dockerfile' --include='docker-compose*.yml' --include='docker-compose*.yaml' --include='*.sh' 2>/dev/null; then
    echo "❌ Abortado: flag '--inspect' encontrada em arquivos de deploy." ; exit 22
  fi

  # 3) NODE_ENV=development em arquivos de deploy
  if grep -RInE 'NODE_ENV[[:space:]]*=[[:space:]]*development' . \
      --include='Dockerfile' --include='.env*' --include='docker-compose*.yml' --include='docker-compose*.yaml' 2>/dev/null; then
    echo "❌ Abortado: NODE_ENV=development encontrado em arquivos de deploy." ; exit 23
  fi

  echo "✅ Nenhum indicador de debug encontrado."
else
  echo "⚠️  ALLOW_DEBUG=1 definido — ignorando verificações de debug."
fi

# ========= Build =========
echo "⏳ Iniciando build da imagem: ${IMAGE_NAME} ..."
docker build -t "${IMAGE_NAME}" .
echo "✅ Build finalizado."

# ========= Push =========
echo "📦 Enviando imagem para o registry privado em ${IP}:${REG_PORT}..."
docker push "${IMAGE_NAME}"
echo "🚀 Enviado com sucesso!"

# ========= Dica de execução =========
echo
echo "🔗 Para rodar o container:"
echo "    docker run -d --name ${NAME} --env-file .env -p ${APP_PORT}:${APP_PORT} ${IMAGE_NAME}"
echo
echo "   (Sem .env, use: docker run -d --name ${NAME} -e PORT=${APP_PORT} -p ${APP_PORT}:${APP_PORT} ${IMAGE_NAME})"
