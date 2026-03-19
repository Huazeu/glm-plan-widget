import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("electron", {
	closeWindow: () => ipcRenderer.send("close-window"),
	fetchApi: (url, options) => ipcRenderer.invoke("fetch-api", url, options)
});
//#endregion
