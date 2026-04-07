import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'electron',
  {
    closeWindow: () => ipcRenderer.send('close-window'),
    quitApp: () => ipcRenderer.send('quit-app'),
    fetchApi: (url: string, options: any) => ipcRenderer.invoke('fetch-api', url, options),
  }
)
