@echo off
echo ========================================
echo Database Location Finder
echo ========================================
echo.

echo Your development database is likely at:
echo %APPDATA%\Electron\snippets.db
echo.

echo Your production database is at:
echo %APPDATA%\dev-snippet\snippets.db
echo.

echo ========================================
echo Checking if databases exist...
echo ========================================
echo.

if exist "%APPDATA%\Electron\snippets.db" (
    echo [FOUND] Development database: %APPDATA%\Electron\snippets.db
    dir "%APPDATA%\Electron\snippets.db"
) else (
    echo [NOT FOUND] Development database
)

echo.

if exist "%APPDATA%\dev-snippet\snippets.db" (
    echo [FOUND] Production database: %APPDATA%\dev-snippet\snippets.db
    dir "%APPDATA%\dev-snippet\snippets.db"
) else (
    echo [NOT FOUND] Production database
)

echo.
echo ========================================
echo To copy dev database to production:
echo ========================================
echo.
echo 1. Close the app completely
echo 2. Run: copy-database.bat
echo.
pause
