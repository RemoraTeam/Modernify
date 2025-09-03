const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { windowManager } = require('node-window-manager');
const robot = require('robotjs');

// Helper do wyboru ścieżek EXE zależnie od środowiska
function getResourcePath(filename) {
    // Jeśli w Electron buildzie: użyj process.resourcesPath (EXE jest obok)
    if (process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, filename))) {
        return path.join(process.resourcesPath, filename);
    }
    // Inaczej (dev, npm start): szukaj obok skryptu
    return path.join(__dirname, filename);
}

const PATCHER_NAME = 'UltraUXThemePatcher_4.4.4.exe';
const PATCHER_SOURCE = getResourcePath(PATCHER_NAME);
const WINDOW_TITLE = 'UltraUXThemePatcher 4.4.4';

const AFTERRESTART_NAME = 'afterrestart.exe';
const AFTERRESTART_SOURCE = getResourcePath(AFTERRESTART_NAME);
const AFTERRESTART_DEST = 'C:\\Modernify\\afterrestart.exe';

// Ścieżka do folderu autostartu Windows
const startupDir = path.join(
    process.env.APPDATA,
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup'
);
// Nazwa tymczasowego pliku .bat w autostarcie
const autostartBat = path.join(startupDir, 'afterrestart-once.bat');

// 1. Uruchom ThemePatcher
console.log('Uruchamiam UltraUXThemePatcher...');
spawn(PATCHER_SOURCE, { detached: true, stdio: 'ignore' });

let afterrestartBatCreated = false;

function findWindow() {
    const allWindows = windowManager.getWindows();
    return allWindows.find(win =>
        win.getTitle().includes(WINDOW_TITLE)
    );
}

function automate(targetWindow) {
    targetWindow.bringToTop();
    setTimeout(() => {
        robot.keyTap('enter');
        setTimeout(() => {
            robot.keyTap('tab');
            setTimeout(() => {
                robot.keyTap('space');
                let delay = 0;
                for (let i = 0; i < 7; i++) {
                    // PO 4 ENTERZE (czyli po i==4) — większa przerwa
                    if (i === 4) {
                        delay += 2000; // tu ustawiasz DŁUŻSZĄ przerwę (np. 2 sekundy)
                    } else {
                        delay += 300;
                    }
                    setTimeout(() => {
                        robot.keyTap('enter');
                        // PO OSTATNIM ENTERZE (i==6) — restart systemu
                        if (i === 6) {
                            setTimeout(() => {
                                console.log('Restartuję system...');
                                exec('shutdown /r /t 0');
                            }, 800); // Mały bufor na reakcję aplikacji
                        }
                    }, delay);
                }
            }, 900);
        }, 300);
    }, 800);
}

function copyAndSetAutostart() {
    // 1. Kopiuj afterrestart.exe
    if (!fs.existsSync('C:\\Modernify')) {
        fs.mkdirSync('C:\\Modernify', { recursive: true });
    }
    fs.copyFileSync(AFTERRESTART_SOURCE, AFTERRESTART_DEST);
    console.log('Plik afterrestart.exe został SKOPIOWANY do C:\\Modernify');

    // 2. Utwórz jednorazowy autostart (bat, który sam się usuwa)
    const batContent = `
@echo off
setlocal

:: === [UAC] Sprawdzenie i automatyczne podniesienie uprawnień ===
:: fltmc wymaga uprawnień admina – jeśli błąd, wznawiamy z RunAs
fltmc >nul 2>&1
if errorlevel 1 (
  echo [i] Prosze czekac...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
start "" "${AFTERRESTART_DEST}"
del "%~f0
endlocal"
    `.trim();

    fs.writeFileSync(autostartBat, batContent, 'utf8');
    console.log('Po restarcie systemu afterrestart.exe uruchomi się JEDEN raz!');
}

let tries = 0;
const maxTries = 30;
const interval = setInterval(() => {
    tries++;
    const targetWindow = findWindow();
    if (targetWindow) {
        if (!afterrestartBatCreated) {
            copyAndSetAutostart();
            afterrestartBatCreated = true;
        }
        automate(targetWindow);
        clearInterval(interval);
    } else if (tries > maxTries) {
        clearInterval(interval);
        console.error('Nie udało się znaleźć okna UltraUXThemePatcher.');
        process.exit(1);
    }
}, 500);
