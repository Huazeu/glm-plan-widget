/// <reference types="vite/client" />

interface Window {
  electron: {
    closeWindow: () => void;
    fetchApi: (url: string, options: any) => Promise<any>;
  }
}
