const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const robot = require('robotjs');

// Helper do wyboru ścieżki zależnie od środowiska (dev/Electron build)
function getResourcePath(filename) {
    // Jeśli w Electron buildzie: użyj process.resourcesPath
    if (process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, filename))) {
        return path.join(process.resourcesPath, filename);
    }
    // Inaczej (dev, npm start): szukaj obok skryptu
    return path.join(__dirname, filename);
}

const DEST_DIR = 'C:\\Modernify';
const MSIX_NAME = 'translucenttb-2023-2.msixbundle';
const MSIX_SOURCE = getResourcePath(MSIX_NAME);
const MSIX_DEST = path.join(DEST_DIR, MSIX_NAME);

const PATCHER_BAT_NAME = 'explorerpatcher.bat';
const PATCHER_BAT = getResourcePath(PATCHER_BAT_NAME);

// Upewnij się, że plik .msixbundle jest w DEST_DIR
if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}
if (!fs.existsSync(MSIX_DEST)) {
    fs.copyFileSync(MSIX_SOURCE, MSIX_DEST);
    console.log('Skopiowano', MSIX_SOURCE, 'do', MSIX_DEST);
}

// Odpal instalator translucenttb w nowym oknie
const msixCmd = `start "" "${MSIX_DEST}"`;
console.log('Odpalam:', msixCmd);
exec(msixCmd, { cwd: DEST_DIR });

// Automatyzacja: TAB po 1s, ENTER po 0.3s
setTimeout(() => {
    robot.keyTap('tab');
    setTimeout(() => {
        robot.keyTap('enter');

        // Otwórz explorerpatcher.bat po 2 sekundach
        setTimeout(() => {
            console.log('Odpalam explorerpatcher.bat z:', PATCHER_BAT);
            exec(`start "" "${PATCHER_BAT}"`, { cwd: path.dirname(PATCHER_BAT) });
        }, 2000);

    }, 300);
}, 1000);
