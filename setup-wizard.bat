@echo off
cls
color 0A
title Dev Snippet Setup Wizard

:welcome
echo.
echo     ╔═══════════════════════════════════════════════════════════════╗
echo     ║                    DEV SNIPPET SETUP WIZARD                  ║
echo     ╚═══════════════════════════════════════════════════════════════╝
echo.
echo     Welcome to the Dev Snippet Setup Wizard.
echo.
echo     This wizard will guide you through the installation of Dev Snippet.
echo.
echo     Press any key to continue...
pause >nul

:license
cls
echo.
echo     ╔═══════════════════════════════════════════════════════════════╗
echo     ║                      LICENSE AGREEMENT                        ║
echo     ╚═══════════════════════════════════════════════════════════════╝
echo.
echo     By installing this software, you agree to use Dev Snippet
echo     for managing your code snippets.
echo.
echo     Do you accept the license agreement? (Y/N)
set /p license=     
if /i "%license%"=="N" goto cancel
if /i "%license%"=="n" goto cancel

:directory
cls
echo.
echo     ╔═══════════════════════════════════════════════════════════════╗
echo     ║                   CHOOSE INSTALL LOCATION                     ║
echo     ╚═══════════════════════════════════════════════════════════════╝
echo.
set "installDir=%USERPROFILE%\Dev-Snippet"
echo     Default installation directory:
echo     %installDir%
echo.
echo     Press Enter to use default location, or type a new path:
set /p userDir=     
if not "%userDir%"=="" set "installDir=%userDir%"

:confirm
cls
echo.
echo     ╔═══════════════════════════════════════════════════════════════╗
echo     ║                     READY TO INSTALL                         ║
echo     ╚═══════════════════════════════════════════════════════════════╝
echo.
echo     Installation directory: %installDir%
echo.
echo     Ready to install Dev Snippet.
echo     Press any key to begin installation...
pause >nul

:install
cls
echo.
echo     ╔═══════════════════════════════════════════════════════════════╗
echo     ║                       INSTALLING...                          ║
echo     ╚═══════════════════════════════════════════════════════════════╝
echo.
echo     Creating installation directory...
mkdir "%installDir%" 2>nul

echo     Copying application files...
xcopy /s /y /q "dist\win-unpacked\*" "%installDir%\"

echo     Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Dev Snippet.lnk'); $Shortcut.TargetPath = '%installDir%\electron.exe'; $Shortcut.WorkingDirectory = '%installDir%'; $Shortcut.Save()"

echo     Creating start menu entry...
mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Dev Snippet\" 2>nul
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Dev Snippet\Dev Snippet.lnk'); $Shortcut.TargetPath = '%installDir%\electron.exe'; $Shortcut.WorkingDirectory = '%installDir%'; $Shortcut.Save()"

:complete
cls
echo.
echo     ╔═══════════════════════════════════════════════════════════════╗
echo     ║                   INSTALLATION COMPLETE                      ║
echo     ╚═══════════════════════════════════════════════════════════════╝
echo.
echo     Dev Snippet has been successfully installed!
echo.
echo     Installation location: %installDir%
echo.
echo     Desktop shortcut: Created
echo     Start menu entry: Created
echo.
echo     Press any key to finish...
pause >nul
goto end

:cancel
cls
echo.
echo     Installation cancelled by user.
echo.
pause
goto end

:end