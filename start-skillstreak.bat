@echo off
title SkillStreak AI (close this window to stop the site)
cd /d "%~dp0"

rem Already running? Just open the browser.
powershell -NoProfile -Command "$up = { param($p) (Test-NetConnection localhost -Port $p -WarningAction SilentlyContinue).TcpTestSucceeded }; if ((& $up 3000) -and (& $up 4000)) { exit 0 } else { exit 1 }" >nul 2>&1
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

rem The site runs as a production build: pages open the moment you click.
rem Rebuild only when there is no build yet or the frontend code changed since.
set SITE=prod
powershell -NoProfile -Command "$id = 'frontend\.next\BUILD_ID'; if (-not (Test-Path $id)) { exit 1 }; $t = (Get-Item $id).LastWriteTime; $src = @(Get-ChildItem frontend\app, frontend\components, frontend\lib, frontend\hooks, frontend\store, frontend\public -Recurse -File -ErrorAction SilentlyContinue) + @(Get-Item frontend\next.config.js, frontend\tailwind.config.ts, frontend\package.json -ErrorAction SilentlyContinue); if ($src | Where-Object { $_.LastWriteTime -gt $t }) { exit 1 } else { exit 0 }"
if not %errorlevel%==0 (
  echo Preparing the fast version of the site. This takes about 5 minutes,
  echo and only happens after the code changes.
  echo.
  call npm run build:frontend
  if errorlevel 1 (
    echo.
    echo The build failed, so the site will start in slower development mode instead.
    set SITE=dev
  )
)

echo Starting SkillStreak AI (website + server)...
echo The browser opens by itself once the site is ready.
echo Close this window to stop everything.
echo.

rem Open the browser as soon as the site answers on port 3000.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for ($i=0; $i -lt 180; $i++) { try { Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 5 | Out-Null; Start-Process 'http://localhost:3000'; break } catch { Start-Sleep 2 } }"

if "%SITE%"=="dev" (
  call npx concurrently -k -n site,server -c cyan,magenta "npm:dev:frontend" "npm:dev:backend"
) else (
  call npx concurrently -k -n site,server -c cyan,magenta "npm --workspace frontend run start" "npm:dev:backend"
)
