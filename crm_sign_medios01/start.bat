@echo off
setlocal enabledelayedexpansion

REM Colors using ANSI escape codes
set RESET=[0m
set BLUE=[0;34m
set GREEN=[0;32m
set YELLOW=[1;33m
set RED=[0;31m

echo %BLUE%====================================================%RESET%
echo %BLUE%   CRM Sign Medios - Local Development Setup%RESET%
echo %BLUE%====================================================%RESET%
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Docker no está corriendo. Por favor inicia Docker.%RESET%
    pause
    exit /b 1
)

echo %YELLOW%📦 Instalando dependencias...%RESET%
call pnpm install
if errorlevel 1 (
    echo %RED%❌ Error al instalar dependencias%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ Dependencias instaladas%RESET%
echo.

echo %YELLOW%🗄️  Iniciando PostgreSQL...%RESET%
call docker-compose up -d
if errorlevel 1 (
    echo %RED%❌ Error al iniciar PostgreSQL%RESET%
    pause
    exit /b 1
)

echo %YELLOW%⏳ Esperando a que PostgreSQL esté listo...%RESET%
timeout /t 5 /nobreak

REM Check if PostgreSQL is healthy
setlocal
for /l %%i in (1,1,30) do (
    docker-compose exec -T postgres pg_isready -U user -d crm_sign_medios >nul 2>&1
    if errorlevel 0 (
        echo %GREEN%✅ PostgreSQL está listo%RESET%
        echo.
        goto :ready
    )
    if %%i equ 30 (
        echo %RED%❌ PostgreSQL no respondió después de 30 segundos%RESET%
        pause
        exit /b 1
    )
    set /a remaining=31-%%i
    timeout /t 1 /nobreak
)

:ready
echo %BLUE%====================================================%RESET%
echo %GREEN%✅ Setup completado exitosamente!%RESET%
echo %BLUE%====================================================%RESET%
echo.

echo %YELLOW%📋 PRÓXIMOS PASOS:%RESET%
echo.

echo %BLUE%1️⃣  Abre otra terminal y ejecuta el BACKEND:%RESET%
echo %YELLOW%    cd backend%RESET%
echo %YELLOW%    pnpm dev%RESET%
echo.

echo %BLUE%2️⃣  Abre otra terminal y ejecuta el FRONTEND:%RESET%
echo %YELLOW%    pnpm dev%RESET%
echo.

echo %BLUE%3️⃣  Abre tu navegador en:%RESET%
echo %GREEN%    http://localhost:5173%RESET%
echo.

echo %BLUE%====================================================%RESET%
echo %BLUE%   Estado de los Servicios:%RESET%
echo %BLUE%====================================================%RESET%
echo.

call docker-compose ps

echo.
echo %BLUE%Para detener PostgreSQL:%RESET%
echo %YELLOW%  docker-compose down%RESET%
echo.

echo %BLUE%Para más información, lee SETUP_LOCAL.md%RESET%
pause
