import { BrowserWindow as e, Menu as t, Tray as n, app as r, ipcMain as i, nativeImage as a } from "electron";
import o from "node:path";
import { fileURLToPath as s } from "node:url";
//#region electron/main.ts
Object.defineProperty(r, "isQuitting", {
	value: !1,
	writable: !0
});
var c = o.dirname(s(import.meta.url));
process.env.APP_ROOT = o.join(c, "..");
var l = process.env.VITE_DEV_SERVER_URL, u = o.join(process.env.APP_ROOT, "dist-electron"), d = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = l ? o.join(process.env.APP_ROOT, "public") : d;
var f, p;
function m() {
	f = new e({
		width: 360,
		height: 600,
		type: "toolbar",
		frame: !1,
		transparent: !0,
		resizable: !1,
		alwaysOnTop: !1,
		skipTaskbar: !0,
		webPreferences: {
			preload: o.join(c, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0,
			webSecurity: !0
		}
	}), f.on("close", (e) => {
		r.isQuitting || (e.preventDefault(), f?.hide());
	}), l ? f.loadURL(l) : f.loadFile(o.join(d, "index.html"));
}
function h() {
	let e;
	try {
		let t = o.join(process.env.VITE_PUBLIC || o.join(c, "../public"), "tray-icon.svg");
		if (e = a.createFromPath(t), e.isEmpty()) throw Error("Icon is empty");
		e = e.resize({
			width: 16,
			height: 16
		});
	} catch {
		console.log("Using generated icon for tray"), e = a.createEmpty();
	}
	try {
		e.isEmpty() && (e = a.createFromDataURL("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9j/P///38GCgDjqAEMw8KQMDIwMAzEaQYjg9GAwWAwGAwGDAaDwWAwYDAAAMb7R/w+q9wXAAAAAElFTkSuQmCC")), p = new n(e);
	} catch (e) {
		console.error("Failed to create tray:", e);
		return;
	}
	let i = t.buildFromTemplate([
		{
			label: "显示小部件",
			click: () => {
				f ? f.show() : m();
			}
		},
		{
			label: "隐藏小部件",
			click: () => {
				f && f.hide();
			}
		},
		{ type: "separator" },
		{
			label: "退出",
			click: () => {
				r.quit();
			}
		}
	]);
	p.setToolTip("GLM Coding Plan Widget"), p.setContextMenu(i), p.on("click", () => {
		f && (f.isVisible() ? f.hide() : f.show());
	});
}
r.on("window-all-closed", (e) => {
	process.platform !== "darwin" && r.quit();
}), r.on("before-quit", () => {
	r.isQuitting = !0;
}), r.on("activate", () => {
	e.getAllWindows().length === 0 && m();
}), r.whenReady().then(() => {
	m(), h();
}), i.on("close-window", () => {
	f && f.hide();
}), i.handle("fetch-api", async (e, t, n) => {
	try {
		let e = await fetch(t, n), r = await e.json();
		return {
			ok: e.ok,
			status: e.status,
			data: r
		};
	} catch (e) {
		return {
			ok: !1,
			error: e.message
		};
	}
});
//#endregion
export { u as MAIN_DIST, d as RENDERER_DIST, l as VITE_DEV_SERVER_URL };
