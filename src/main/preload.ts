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
  toggleFullScreen: (fullscreen: boolean) => ipcRenderer.send("toggleFullScreen", fullscreen),
  onTransferRequest: (callback: (e: IpcRendererEvent, deviceName: string) => void) => ipcRenderer.on("onTransferRequest", callback),
  onTransferSuccess: (callback: () => void) => ipcRenderer.on("onTransferSuccess", callback),
  onTransferError: (callback: (e: IpcRendererEvent, reason?: string) => void) => ipcRenderer.on("onTransferError", callback),
  onTransferAccepted: (images: string[]) => ipcRenderer.send("onTransferAccepted", images),
  onTransferDeclined: () => ipcRenderer.send("onTransferDeclined"),
  switchTab: (callback: () => void) => ipcRenderer.on("switchTab", callback)
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
