import { contextBridge as e, ipcRenderer as t } from "electron";
//#region electron/preload.ts
e.exposeInMainWorld("electron", {
	closeWindow: () => t.send("close-window"),
	fetchApi: (e, n) => t.invoke("fetch-api", e, n)
});
//#endregion
