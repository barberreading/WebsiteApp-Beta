@echo off
echo Starting Staff Management Application...
echo.

echo Starting Backend Server...
start cmd /c "cd /d %~dp0backend && npm start"

echo Starting Frontend Server...
start cmd /c "cd /d %~dp0frontend && set BROWSER=none&& npm start"

:: Application monitor removed to prevent app from closing when browser closes

echo.
echo Staff Management Application is starting...
echo The application will open in your default browser shortly.
echo.
echo DO NOT CLOSE THIS WINDOW WHILE USING THE APPLICATION
echo.

timeout /t 10 /nobreak > nul
start http://localhost:3000

echo Application started successfully!
timeout /t 5 /nobreak > nul
exit