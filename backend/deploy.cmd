@if "%SCM_TRACE_LEVEL%" NEQ "4" @echo off

:: ----------------------
:: KUDU Deployment Script for Node.js
:: Version: 1.0.0
:: ----------------------

:: Prerequisites
:: -------------

:: Verify node.js installed
where node 2>nul >nul
IF %ERRORLEVEL% NEQ 0 (
  echo Missing node.js executable, please install node.js, if already installed make sure it can be reached from current environment.
  goto error
)

:: Setup
:: -----

setlocal enabledelayedexpansion

SET ARTIFACTS=%~dp0%..\artifacts

IF NOT DEFINED DEPLOYMENT_SOURCE (
  SET DEPLOYMENT_SOURCE=%~dp0%.
)

IF NOT DEFINED DEPLOYMENT_TARGET (
  SET DEPLOYMENT_TARGET=%ARTIFACTS%\wwwroot
)

IF NOT DEFINED NEXT_MANIFEST_PATH (
  SET NEXT_MANIFEST_PATH=%ARTIFACTS%\manifest

  IF NOT DEFINED PREVIOUS_MANIFEST_PATH (
    SET PREVIOUS_MANIFEST_PATH=%ARTIFACTS%\manifest
  )
)

IF NOT DEFINED KUDU_SYNC_CMD (
  :: Install kudu sync
  echo Installing Kudu Sync
  call npm install kudusync -g --silent
  IF !ERRORLEVEL! NEQ 0 goto error

  :: Locally just running "kuduSync" would also work
  SET KUDU_SYNC_CMD=%appdata%\npm\kuduSync.cmd
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Deployment
:: ----------

echo Handling Node.js deployment.

:: 1. Select node version
call :SelectNodeVersion

:: 2. Install npm packages
IF EXIST "%DEPLOYMENT_SOURCE%\package.json" (
  pushd "%DEPLOYMENT_SOURCE%"
  echo Installing npm packages...
  call :ExecuteCmd !NPM_CMD! ci --production
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 3. Build TypeScript
IF EXIST "%DEPLOYMENT_SOURCE%\tsconfig.json" (
  pushd "%DEPLOYMENT_SOURCE%"
  echo Building TypeScript...
  call :ExecuteCmd !NPM_CMD! run build
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 4. Generate Prisma Client
IF EXIST "%DEPLOYMENT_SOURCE%\prisma\schema.prisma" (
  pushd "%DEPLOYMENT_SOURCE%"
  echo Generating Prisma Client...
  call :ExecuteCmd npx prisma generate
  IF !ERRORLEVEL! NEQ 0 goto error
  popd
)

:: 5. KuduSync
IF /I "%IN_PLACE_DEPLOYMENT%" NEQ "1" (
  call :ExecuteCmd "%KUDU_SYNC_CMD%" -v 50 -f "%DEPLOYMENT_SOURCE%" -t "%DEPLOYMENT_TARGET%" -n "%NEXT_MANIFEST_PATH%" -p "%PREVIOUS_MANIFEST_PATH%" -i ".git;.hg;.deployment;deploy.cmd"
  IF !ERRORLEVEL! NEQ 0 goto error
)

:: 6. Run migrations in production
IF EXIST "%DEPLOYMENT_TARGET%\prisma\schema.prisma" (
  pushd "%DEPLOYMENT_TARGET%"
  echo Running database migrations...
  call :ExecuteCmd npx prisma migrate deploy
  IF !ERRORLEVEL! NEQ 0 echo Migration failed but continuing...
  popd
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
goto end

:: Execute command routine that will echo out when error
:ExecuteCmd
setlocal
set _CMD_=%*
call %_CMD_%
if "%ERRORLEVEL%" NEQ "0" echo Failed exitCode=%ERRORLEVEL%, command=%_CMD_%
exit /b %ERRORLEVEL%

:error
endlocal
echo An error has occurred during web site deployment.
call :exitSetErrorLevel
call :exitFromFunction 2>nul

:exitSetErrorLevel
exit /b 1

:exitFromFunction
()

:end
endlocal
echo Finished successfully.