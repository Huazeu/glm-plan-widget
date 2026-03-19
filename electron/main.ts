import { app, BrowserWindow, ipcMain, net, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Declare app state
declare global {
  namespace NodeJS {
    interface Process {
      platform: string;
    }
  }
}

// Add isQuitting property to app
Object.defineProperty(app, 'isQuitting', {
  value: false,
  writable: true
});

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null

function createWindow() {
  win = new BrowserWindow({
    width: 360,
    height: 600,
    type: 'toolbar', // Widget style
    frame: false, // Frameless window
    transparent: true, // Transparent background
    resizable: false,
    alwaysOnTop: false, // Allow it to be covered by other windows
    skipTaskbar: true, // Don't show in taskbar since it's a widget/tray app
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true, // keep it secure
    },
  })

  win.on('close', (event) => {
    // Override default close behavior to hide instead
    if (!app.isQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function createTray() {
  // We need to provide a reliable native icon or create one.
  // Using an empty icon sometimes fails to render in Windows Tray.
  // We will create a simple 16x16 icon programmatically with some color so it's visible.
  
  let icon;
  try {
    // Try to load an icon if we had one
    const iconPath = path.join(process.env.VITE_PUBLIC || path.join(__dirname, '../public'), 'vite.svg');
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      throw new Error('Icon is empty');
    }
    icon = icon.resize({ width: 16, height: 16 });
  } catch (e) {
    console.log('Using generated icon for tray');
    // Fallback: Generate a small blue square icon programmatically 
    // to ensure Windows actually renders it in the tray.
    icon = nativeImage.createEmpty();
    // This is just a fallback, it might still not show up if the OS strictly requires a real image buffer.
  }

  // Windows specifically needs a valid image buffer or a valid path.
  // We use a small blue square base64 PNG so it's visible in the tray.
  try {
    if (icon.isEmpty()) {
      // 16x16 blue square PNG base64
      const b64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9j/P///38GCgDjqAEMw8KQMDIwMAzEaQYjg9GAwWAwGAwGDAaDwWAwYDAAAMb7R/w+q9wXAAAAAElFTkSuQmCC';
      icon = nativeImage.createFromDataURL(`data:image/png;base64,${b64}`);
    }
    tray = new Tray(icon);
  } catch (err) {
    console.error('Failed to create tray:', err);
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '显示小部件', 
      click: () => {
        if (win) {
          win.show();
        } else {
          createWindow();
        }
      } 
    },
    { 
      label: '隐藏小部件', 
      click: () => {
        if (win) win.hide();
      } 
    },
    { type: 'separator' },
    { 
      label: '退出', 
      click: () => {
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('GLM Coding Plan Widget');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
      }
    }
  });
}

// Prevent app from quitting when window is closed (default behavior)
app.on('window-all-closed', (e: Event) => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})

// IPC endpoints for window controls
ipcMain.on('close-window', () => {
  if (win) {
    win.hide(); // Hide to tray instead of quitting
  }
})

// IPC endpoint to proxy HTTP requests to avoid CORS
ipcMain.handle('fetch-api', async (event, url, options) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
})
