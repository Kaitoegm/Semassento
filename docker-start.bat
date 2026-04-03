@echo off
echo ==========================================
echo    SciStat - Inicializador Docker (RECOMENDADO)
echo ==========================================
echo.
echo Verificando se o Docker esta rodando...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Docker nao parece estar rodando. Inicie o Docker Desktop e tente novamente.
    pause
    exit /b
)

echo [1/2] Construindo e iniciando containers...
docker-compose up --build -d

echo.
echo [2/2] SciStat pronto!
echo.
echo   ➜  Frontend: http://localhost:5173
echo   ➜  Backend:  http://localhost:8000
echo.
echo DICA: Para acompanhar os logs em tempo real, use:
echo       docker-compose logs -f
echo.
echo Para encerrar os servicos, use:
echo       docker-compose down
echo.
pause
