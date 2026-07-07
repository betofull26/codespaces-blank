#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   CRM Sign Medios - Local Development Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker no está corriendo. Por favor inicia Docker.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al instalar dependencias${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias instaladas${NC}\n"

echo -e "${YELLOW}🗄️  Iniciando PostgreSQL...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al iniciar PostgreSQL${NC}"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Esperando a que PostgreSQL esté listo...${NC}"
sleep 5

# Check if PostgreSQL is healthy
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U user -d crm_sign_medios > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL está listo${NC}\n"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL no respondió después de 30 segundos${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup completado exitosamente!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📋 PRÓXIMOS PASOS:${NC}\n"

echo -e "${BLUE}1️⃣  Abre otra terminal y ejecuta el BACKEND:${NC}"
echo -e "${YELLOW}    cd backend${NC}"
echo -e "${YELLOW}    pnpm dev${NC}\n"

echo -e "${BLUE}2️⃣  Abre otra terminal y ejecuta el FRONTEND:${NC}"
echo -e "${YELLOW}    pnpm dev${NC}\n"

echo -e "${BLUE}3️⃣  Abre tu navegador en:${NC}"
echo -e "${GREEN}    http://localhost:5173${NC}\n"

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Estado de los Servicios:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

docker-compose ps

echo -e "\n${BLUE}Para detener PostgreSQL:${NC}"
echo -e "${YELLOW}  docker-compose down${NC}\n"

echo -e "${BLUE}Para más información, lee SETUP_LOCAL.md${NC}"
