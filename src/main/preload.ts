// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  store: {
    get: (key: string) => ipcRenderer.invoke('getData', key),
    set: (key: string, data: string) => ipcRenderer.send('setData', key, data)
  },
  chooseDirectory: (maxImageLoad: number) => ipcRenderer.invoke('chooseDirectory', maxImageLoad),
  onDirectoryChosen: (path: string) => ipcRenderer.invoke("onDirectoryChosen", path),
  requestAssociatedFile: () => ipcRenderer.invoke("onRequestAssociatedFile"),
  onExternalFileOpen: (callback: any) => ipcRenderer.on("onExternalFileOpen", callback),
  toggleFullScreen: (fullscreen: boolean) => ipcRenderer.send("toggleFullScreen", fullscreen)
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
