const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    // Get screen resolution
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 600,
        maxWidth: width,
        maxHeight: height,
        resizable: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
        },
    });

    // Load index.html
    mainWindow.loadFile('index.html');

    // Close event
    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });
}

// When Electron is ready, create the window
app.whenReady().then(createWindow);

// Handle window closure
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

