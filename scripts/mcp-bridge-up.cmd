@echo off
setlocal
set "NAME=%1"
set "PORT=%2"
set "PACKAGE=%3"
shift
shift
shift
set "ARGS="
:loop
if "%~1"=="" goto :done
set "ARGS=%ARGS% %~1"
shift
goto :loop
:done
if "%NAME%"=="" exit /b 1
if "%PORT%"=="" exit /b 1
if "%PACKAGE%"=="" exit /b 1

set "MCP_NAME=%NAME%"
set "MCP_PORT=%PORT%"
set "MCP_PACKAGE=%PACKAGE%"
if not "%ARGS%"=="" set "MCP_ARGS=%ARGS%"

set "LOG=%CD%\.mcp-bridge-%NAME%.log"
set "BRIDGE=%~dp0mcp-bridge.mjs"
if not exist "%BRIDGE%" set "BRIDGE=scripts\\mcp-bridge.mjs"

start "" /B cmd /c "node \"%BRIDGE%\" >> \"%LOG%\" 2>&1"
exit /b 0
