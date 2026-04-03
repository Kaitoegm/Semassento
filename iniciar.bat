@echo off
echo ==========================================
echo    SciStat - Inicializador Local
echo   *** RECOMENDADO: USE docker-start.bat ***
echo ==========================================
echo.

:: Iniciar Backend em uma nova janela
echo [1/2] Iniciando Backend Python (FastAPI na porta 8000)...
start "SciStat Backend" cmd /k "cd backend && python main.py"

:: Iniciar Frontend
echo [2/2] Iniciando Frontend React (Vite na porta 5173)...
echo.
echo O navegador abrira automaticamente em instantes.
cd frontend && npm run dev
