@echo off
cd /d "%~dp0.."
echo Iniciando BioSonIA desde: %CD%

echo Iniciando Backend con configuracion de demostracion (sin Base de Datos)...
start "BioSonIA Backend" cmd /k "cd backend && set PORT=5000&& npm install && npm run dev:demo"

echo Esperando 5 segundos...
timeout /t 5 /nobreak

echo Iniciando Frontend...
start "BioSonIA Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo Iniciando Servicio de IA (Python)...
start "BioSonIA AI" cmd /k "cd ai && python -m venv .venv && call .venv\Scripts\activate && pip install -r requirements.txt && set PORT=5001&& python server.py"

echo Todo iniciado. Por favor revisa las ventanas abiertas para ver si hay errores.
pause
