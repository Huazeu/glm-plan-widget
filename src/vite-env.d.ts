/// <reference types="vite/client" />

interface Window {
  electron: {
    closeWindow: () => void;
    quitApp: () => void;
    fetchApi: (url: string, options: any) => Promise<any>;
  }
}
