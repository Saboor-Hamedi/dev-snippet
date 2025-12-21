@echo off
echo ========================================
echo Database Restore Tool
echo ========================================
echo.
echo This will show you available backups and let you restore one.
echo.
echo WARNING: Make sure the app is CLOSED before restoring!
echo.
pause

set BACKUP_DIR=%APPDATA%\dev-snippet\backups
set DB_PATH=%APPDATA%\dev-snippet\snippets.db

if not exist "%BACKUP_DIR%" (
    echo ERROR: Backup directory not found!
    echo Location: %BACKUP_DIR%
    pause
    exit /b 1
)

echo.
echo ========================================
echo Available Backups:
echo ========================================
echo.

dir /b /o-d "%BACKUP_DIR%\snippets-backup-*.db" 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo No backups found!
    pause
    exit /b 1
)

echo.
echo ========================================
echo.
echo To restore a backup:
echo 1. Note the filename of the backup you want
echo 2. Close this window
echo 3. Navigate to: %BACKUP_DIR%
echo 4. Copy the backup file you want
echo 5. Navigate to: %APPDATA%\dev-snippet
echo 6. Rename the backup to: snippets.db (replace existing)
echo 7. Start the app
echo.
echo OR run: restore-specific-backup.bat
echo.
pause

explorer "%BACKUP_DIR%"
