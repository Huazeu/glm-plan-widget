import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
//#region electron/main.ts
Object.defineProperty(app, "isQuitting", {
	value: false,
	writable: true
});
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
var RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
var win;
var tray;
function createWindow() {
	win = new BrowserWindow({
		width: 360,
		height: 600,
		type: "toolbar",
		frame: false,
		transparent: true,
		resizable: false,
		alwaysOnTop: false,
		skipTaskbar: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			nodeIntegration: false,
			contextIsolation: true,
			webSecurity: true
		}
	});
	win.on("close", (event) => {
		if (!app.isQuitting) {
			event.preventDefault();
			win?.hide();
		}
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(path.join(RENDERER_DIST, "index.html"));
}
function createTray() {
	let icon;
	try {
		const iconPath = path.join(process.env.VITE_PUBLIC || path.join(__dirname, "../public"), "vite.svg");
		icon = nativeImage.createFromPath(iconPath);
		if (icon.isEmpty()) throw new Error("Icon is empty");
		icon = icon.resize({
			width: 16,
			height: 16
		});
	} catch (e) {
		console.log("Using generated icon for tray");
		icon = nativeImage.createEmpty();
	}
	try {
		if (icon.isEmpty()) icon = nativeImage.createFromDataURL(`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9j/P///38GCgDjqAEMw8KQMDIwMAzEaQYjg9GAwWAwGAwGDAaDwWAwYDAAAMb7R/w+q9wXAAAAAElFTkSuQmCC`);
		tray = new Tray(icon);
	} catch (err) {
		console.error("Failed to create tray:", err);
		return;
	}
	const contextMenu = Menu.buildFromTemplate([
		{
			label: "显示小部件",
			click: () => {
				if (win) win.show();
				else createWindow();
			}
		},
		{
			label: "隐藏小部件",
			click: () => {
				if (win) win.hide();
			}
		},
		{ type: "separator" },
		{
			label: "退出",
			click: () => {
				app.quit();
			}
		}
	]);
	tray.setToolTip("GLM Coding Plan Widget");
	tray.setContextMenu(contextMenu);
	tray.on("click", () => {
		if (win) if (win.isVisible()) win.hide();
		else win.show();
	});
}
app.on("window-all-closed", (e) => {
	if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => {
	app.isQuitting = true;
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(() => {
	createWindow();
	createTray();
});
ipcMain.on("close-window", () => {
	if (win) win.hide();
});
ipcMain.handle("fetch-api", async (event, url, options) => {
	try {
		const response = await fetch(url, options);
		const data = await response.json();
		return {
			ok: response.ok,
			status: response.status,
			data
		};
	} catch (error) {
		return {
			ok: false,
			error: error.message
		};
	}
});
//#endregion
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
