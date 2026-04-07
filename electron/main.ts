import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// 彻底禁用 Chromium 磁盘日志，只允许控制台输出
// 1. 将日志文件重定向到 NUL（Windows 空设备），防止写入 C 盘 AppData
app.commandLine.appendSwitch('log-file', 'NUL')
// 2. 设置日志级别为最低（3 = FATAL only），减少不必要的日志产生
app.commandLine.appendSwitch('log-level', '3')
// 3. 禁用 leveldb 的 verbose 日志
app.commandLine.appendSwitch('enable-features', 'LeveldbUseDirectIO')

let win: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createWindow() {
  win = new BrowserWindow({
    width: 360,
    height: 600,
    type: 'toolbar',
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  })

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win?.hide()
    }
  })

  win.on('closed', () => {
    win = null
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function createTrayIcon() {
  const size = 16
  const bytesPerPixel = 4
  const buffer = Buffer.alloc(size * size * bytesPerPixel)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * bytesPerPixel
      const cx = x - size / 2 + 0.5
      const cy = y - size / 2 + 0.5
      const dist = Math.sqrt(cx * cx + cy * cy)

      if (dist <= 7) {
        buffer[idx] = 59
        buffer[idx + 1] = 130
        buffer[idx + 2] = 246
        buffer[idx + 3] = 255
      } else if (dist <= 7.5) {
        buffer[idx] = 59
        buffer[idx + 1] = 130
        buffer[idx + 2] = 246
        buffer[idx + 3] = 128
      } else {
        buffer[idx] = 0
        buffer[idx + 1] = 0
        buffer[idx + 2] = 0
        buffer[idx + 3] = 0
      }
    }
  }

  return nativeImage.createFromBuffer(buffer, {
    width: size,
    height: size,
    scaleFactor: 1.0,
  })
}

function createTray() {
  // 使用预制的 tray-icon.png 替代动态生成的图标
  // 动态 Buffer 图标在 Windows 上会出现颜色异常（显示为橙红色小圆点）
  const iconPath = path.join(process.env.VITE_PUBLIC || '', 'tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  if (icon.isEmpty()) {
    const fallbackIcon = createTrayIcon()
    if (fallbackIcon.isEmpty()) {
      return
    }
    tray = new Tray(fallbackIcon)
  } else {
    tray = new Tray(icon)
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示小部件',
      click: () => {
        if (win) {
          win.show()
          win.focus()
        } else {
          createWindow()
        }
      }
    },
    {
      label: '隐藏小部件',
      click: () => {
        win?.hide()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('GLM Coding Plan Widget')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide()
      } else {
        win.show()
        win.focus()
      }
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()

  ipcMain.on('close-window', () => {
    if (win && win.isVisible()) {
      win.hide()
    }
  })

  ipcMain.on('quit-app', () => {
    isQuitting = true
    app.quit()
  })

  ipcMain.handle('fetch-api', async (_event, url, options) => {
    try {
      const response = await fetch(url, options)
      const data = await response.json()
      return { ok: response.ok, status: response.status, data }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  })
})
