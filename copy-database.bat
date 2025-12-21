@echo off
echo ========================================
echo Database Copy Tool
echo ========================================
echo.
echo This will copy your development database
echo to the production location.
echo.
echo WARNING: This will overwrite the production database!
echo.
pause

echo.
echo Copying database...
echo.

if not exist "%APPDATA%\Electron\snippets.db" (
    echo ERROR: Development database not found!
    echo Location: %APPDATA%\Electron\snippets.db
    pause
    exit /b 1
)

if not exist "%APPDATA%\dev-snippet" (
    echo Creating production directory...
    mkdir "%APPDATA%\dev-snippet"
)

copy /Y "%APPDATA%\Electron\snippets.db" "%APPDATA%\dev-snippet\snippets.db"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Database copied successfully.
    echo ========================================
    echo.
    echo Your data should now appear in the production app.
) else (
    echo.
    echo ERROR: Failed to copy database.
    echo Make sure the app is closed completely.
)

echo.
pause
