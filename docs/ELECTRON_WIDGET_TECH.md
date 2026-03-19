# GLM Plan Widget 技术原理解析

在开发这个桌面小部件（GLM Plan Widget）的过程中，我们使用了 `Electron + React + Vite + TailwindCSS` 的现代化技术栈。为了实现一个体验优秀的“桌面挂件”，我们解决了一些常见的技术痛点。本篇文档将深入解析这些技术方案。

---

## 1. 无边框透明窗口 (Frameless & Transparent Window)

为了让应用看起来像一个悬浮在桌面上的小部件，而不是一个传统的软件，我们去掉了窗口的边框和背景。

### 技术实现
在 Electron 主进程（`main.ts`）创建 `BrowserWindow` 时，配置以下关键属性：
```typescript
win = new BrowserWindow({
  width: 360,
  height: 600,
  type: 'toolbar',       // 将窗口类型设置为工具栏，行为更像一个小部件
  frame: false,          // 移除系统原生的标题栏和边框
  transparent: true,     // 允许窗口背景透明
  resizable: false,      // 禁止调整大小
  skipTaskbar: true,     // 在任务栏中隐藏该应用的图标，使其更纯粹
  // ...
})
```

### 可拖拽实现
去掉了原生标题栏后，窗口默认是无法拖动的。为了恢复拖动功能，我们在前端 CSS 中使用了 Electron 特有的 CSS 属性：
```css
/* 让整个 body 区域都可以作为拖拽把手 */
body {
  -webkit-app-region: drag;
}

/* 防止按钮、输入框等交互元素被拖拽拦截，导致无法点击 */
button, input, select, .no-drag {
  -webkit-app-region: no-drag;
}
```

---

## 2. 跨域请求处理 (CORS Bypass)

在这个项目中，我们需要从前端页面直接请求智谱 API（`https://open.bigmodel.cn`）。由于浏览器的同源策略（CORS），直接在 React（渲染进程）中发起 `fetch` 会被拦截。

### 为什么不关闭 webSecurity？
许多早期的教程会建议在 `webPreferences` 中设置 `webSecurity: false` 来绕过跨域。这是**极其危险**的做法，会导致应用容易受到 XSS 等攻击。

### 最佳实践：主进程代理 (Main Process Proxy)
Electron 的主进程（Node.js 环境）是不受浏览器 CORS 限制的。因此我们将请求逻辑委托给主进程。

**Step 1: 在主进程注册处理函数 (`main.ts`)**
```typescript
ipcMain.handle('fetch-api', async (event, url, options) => {
  try {
    const response = await fetch(url, options); // Node.js 环境的 fetch 无跨域限制
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
})
```

**Step 2: 通过 Preload 暴露给渲染进程 (`preload.ts`)**
```typescript
contextBridge.exposeInMainWorld('electron', {
  fetchApi: (url, options) => ipcRenderer.invoke('fetch-api', url, options),
})
```

**Step 3: 在前端调用 (`api.ts`)**
```typescript
const res = await window.electron.fetchApi(url, headers);
```
通过这种 IPC（进程间通信）机制，我们既保证了安全性，又完美解决了跨域问题。

---

## 3. 系统托盘与最小化 (System Tray)

桌面小部件通常不需要占据任务栏空间，而是最小化到右下角的系统托盘中。

### 托盘图标不可见的“坑”
在 Windows 系统下，创建 `Tray` 对象必须提供一个**有效的、非全透明的图像缓冲区**。如果传入的路径错误，或者使用了 `nativeImage.createEmpty()`，Windows 会拒绝渲染这个图标，导致托盘区出现“幽灵占位”甚至完全不显示。

**解决方案：提供 Base64 保底图标**
为了保证代码在任何环境（甚至找不到本地图标文件时）都能正常运行，我们使用了一段蓝色的 16x16 像素 Base64 编码图片作为保底：
```typescript
let icon;
try {
  icon = nativeImage.createFromPath('path/to/icon.svg');
} catch (e) {
  // 如果读取失败，使用 Base64 保底
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h...'; // 省略完整编码
  icon = nativeImage.createFromDataURL(`data:image/png;base64,${b64}`);
}
tray = new Tray(icon);
```

### “关闭”即“隐藏”
为了让点击右上角 `×` 按钮时不是退出程序而是进入托盘，我们需要拦截窗口的原生 `close` 事件：
```typescript
win.on('close', (event) => {
  // 如果不是明确要退出应用（如通过托盘菜单退出），则拦截关闭并改为隐藏
  if (!app.isQuitting) {
    event.preventDefault();
    win?.hide();
  }
});
```

---

## 4. 打包与环境问题 (electron-builder Symlink Error)

当我们使用 `electron-builder` 打包 Windows 应用程序（`npm run dist`）时，常常会遇到一个著名的报错：

> `Cannot create symbolic link : 客户端没有所需的特权`

### 报错原因
`electron-builder` 在打包 Windows 应用时，需要下载一个名为 `winCodeSign` 的依赖（用于代码签名）。这个依赖包（由 7-Zip 压缩）内部包含了 macOS 环境的符号链接文件（Symlink）。
而在 Windows 系统中，**只有管理员权限**才被允许创建符号链接。因此，以普通用户身份运行终端时，7-Zip 解压会失败。

### 解决方案
1. **以管理员身份运行终端**：关闭 VS Code/命令行，右键“以管理员身份运行”，再次执行 `npm run dist`，即可顺利解压和打包。
2. **手动解压**：去报错路径（通常在 `C:\Users\用户名\AppData\Local\electron-builder\Cache\winCodeSign`），找到 `.7z` 压缩包，手动用系统里的解压软件将其解压，然后重新运行打包命令。

---

## 结语
构建一个现代化的桌面小部件，不仅需要前端 UI 的精细打磨（React + Tailwind + Recharts），还需要深入理解 Electron 的底层机制（IPC、Window 配置、系统托盘、权限管理）。希望这篇技术解析能为你未来的桌面应用开发提供有价值的参考！