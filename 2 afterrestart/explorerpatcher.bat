@echo off
setlocal

:: === [UAC] Sprawdzenie i automatyczne podniesienie uprawnień ===
:: fltmc wymaga uprawnień admina – jeśli błąd, wznawiamy z RunAs
fltmc >nul 2>&1
if errorlevel 1 (
  echo [i] Ten instalator wymaga uprawnien administratora. Pokaze sie monit UAC...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

:: (opcjonalnie) upewnij się, że docelowe katalogi istnieją
if not exist "C:\Modernify\" mkdir "C:\Modernify\" >nul 2>&1
if not exist "C:\Windows\Resources\Themes\" mkdir "C:\Windows\Resources\Themes\" >nul 2>&1

REM Uruchom instalator ep_setup.exe
start "" "%~dp0ep_setup.exe"

REM Importuj ustawienia rejestru
reg import "%~dp0ExplorerPatcher.reg"

REM Kopiuj motywy
xcopy "%~dp0Themes\*" "C:\Windows\Resources\Themes\" /E /I /Y

REM Odblokuj wszystkie pliki .theme w docelowym folderze
powershell -Command "Get-ChildItem 'C:\Windows\Resources\Themes\' -Filter *.theme | Unblock-File"

REM Zaaplikuj Fluent Dark Mode.theme
start "" "C:\Windows\Resources\Themes\Fluent Dark Mode.theme"

REM Kopiuj tapetę do C:\Modernify
xcopy "%~dp0wallpaper-modernify.png" "C:\Modernify\" /Y /I

REM Ustaw tapetę
powershell -Command "$code = New-Object -ComObject WScript.Shell; $code.RegWrite('HKCU\Control Panel\Desktop\Wallpaper','C:\Modernify\wallpaper-modernify.png'); RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters ,1 ,True"

REM Komunikat w okienku i restart od razu po kliknięciu OK
powershell -Command "Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::Show('Modernify zostal pomyslnie zainstalowany, teraz restartujemy system na wszelki wypadek.','Modernify', 'OK', 'Information')"

REM Restart systemu
shutdown /r /t 0 /c "Restart wymagany po instalacji Modernify"

endlocal
