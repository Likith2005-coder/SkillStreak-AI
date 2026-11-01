@echo off
title SkillStreak AI (close this window to stop the site)
cd /d "%~dp0"

rem Already running? Just open the browser.
powershell -NoProfile -Command "if ((Test-NetConnection localhost -Port 3000 -WarningAction SilentlyContinue).TcpTestSucceeded) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
  echo SkillStreak is already running. Opening http://localhost:3000 ...
  start "" http://localhost:3000
  timeout /t 3 >nul
  exit /b
)

if not exist node_modules (
  echo First run: installing packages, this takes a few minutes...
  call npm install
)

echo Starting SkillStreak AI (website + server)...
echo The browser opens by itself once the site is ready.
echo Close this window to stop everything.
echo.

rem Open the browser as soon as the site answers on port 3000.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for ($i=0; $i -lt 180; $i++) { try { Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 5 | Out-Null; Start-Process 'http://localhost:3000'; break } catch { Start-Sleep 2 } }"

call npx concurrently -k -n site,server -c cyan,magenta "npm:dev:frontend" "npm:dev:backend"
