// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { MediaInfo } from 'renderer/constant/types';

export type Channels = 'ipc-example';

const electronHandler = {
  store: {
    get: (key: string) => ipcRenderer.invoke('getData', key),
    set: (key: string, data: string) => ipcRenderer.send('setData', key, data)
  },
  chooseDirectory: (maxMediaLoad: number) => ipcRenderer.invoke('chooseDirectory', maxMediaLoad),
  onDirectoryChosen: (path: string) => ipcRenderer.invoke("onDirectoryChosen", path),
  requestAssociatedFile: () => ipcRenderer.invoke("onRequestAssociatedFile"),
  toggleFullScreen: (fullscreen: boolean) => ipcRenderer.send("toggleFullScreen", fullscreen),
  onTransferRequest: (callback: (e: IpcRendererEvent, deviceName: string) => void) => ipcRenderer.on("onTransferRequest", callback),
  onTransferSuccess: (callback: () => void) => ipcRenderer.on("onTransferSuccess", callback),
  onTransferError: (callback: (e: IpcRendererEvent, reason?: string) => void) => ipcRenderer.on("onTransferError", callback),
  onTransferAccepted: (name: string, images: string[]) => ipcRenderer.send("onTransferAccepted", name, images),
  onTransferDeclined: () => ipcRenderer.send("onTransferDeclined"),
  queueForRemoval: (imageInfo: MediaInfo) => ipcRenderer.send("queueForRemoval", imageInfo),
  setURL: (url: string) => ipcRenderer.send("setURL", url),
  getWifiIP: (callback: any) => ipcRenderer.on("getWifiIP", callback),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
