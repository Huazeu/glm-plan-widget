import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    closeWindow: () => ipcRenderer.send('close-window'),
    fetchApi: (url: string, options: any) => ipcRenderer.invoke('fetch-api', url, options),
  }
)