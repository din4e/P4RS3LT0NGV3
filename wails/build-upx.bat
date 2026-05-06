@echo off
REM Build with UPX compression
REM Usage: build-upx.bat [platform]

setlocal

set PLATFORM=%1
if "%PLATFORM%"=="" set PLATFORM=windows

echo Building P4RS3LT0NGV3 for %PLATFORM%...
wails build -platform %PLATFORM%

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b 1
)

echo.
echo Compressing with UPX...

set EXE_PATH=build\bin\P4RS3LT0NGV3.exe

if exist "%EXE_PATH%" (
    upx --best --ultra-brute "%EXE_PATH%"
    echo.
    echo Done! Output: %EXE_PATH%
) else (
    echo Executable not found at %EXE_PATH%
    exit /b 1
)
