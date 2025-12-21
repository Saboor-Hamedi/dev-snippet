@echo off
echo ========================================
echo Database Recovery Tool
echo ========================================
echo.
echo Searching for database files and backups...
echo.

echo Checking Electron folder:
echo %APPDATA%\Electron
echo.
if exist "%APPDATA%\Electron" (
    dir /s /b "%APPDATA%\Electron\*.db*"
) else (
    echo Folder not found
)

echo.
echo ========================================
echo Checking dev-snippet folder:
echo %APPDATA%\dev-snippet
echo.
if exist "%APPDATA%\dev-snippet" (
    dir /s /b "%APPDATA%\dev-snippet\*.db*"
) else (
    echo Folder not found
)

echo.
echo ========================================
echo Checking for WAL and SHM files (SQLite backups):
echo.
if exist "%APPDATA%\Electron\snippets.db-wal" (
    echo [FOUND] WAL file: %APPDATA%\Electron\snippets.db-wal
    dir "%APPDATA%\Electron\snippets.db-wal"
)
if exist "%APPDATA%\Electron\snippets.db-shm" (
    echo [FOUND] SHM file: %APPDATA%\Electron\snippets.db-shm
    dir "%APPDATA%\Electron\snippets.db-shm"
)
if exist "%APPDATA%\dev-snippet\snippets.db-wal" (
    echo [FOUND] WAL file: %APPDATA%\dev-snippet\snippets.db-wal
    dir "%APPDATA%\dev-snippet\snippets.db-wal"
)
if exist "%APPDATA%\dev-snippet\snippets.db-shm" (
    echo [FOUND] SHM file: %APPDATA%\dev-snippet\snippets.db-shm
    dir "%APPDATA%\dev-snippet\snippets.db-shm"
)

echo.
echo ========================================
echo Checking project directory for backups:
echo.
dir /s /b "*.db*" 2>nul

echo.
echo ========================================
echo Checking Windows Recycle Bin is not possible via script
echo Please check your Recycle Bin manually for:
echo - snippets.db
echo - snippets.db-wal
echo - snippets.db-shm
echo.
pause
