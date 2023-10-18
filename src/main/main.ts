/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog, IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';
import fs from 'fs';
import sizeOf from 'image-size'
import { ImageInfo } from 'renderer/constant/types';
import Store from 'electron-store'
import InstantiateExpress, { setPermission } from './app';
// import InstantiateExpress from './app';

let stopLoadingImage = false;

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// InstantiateExpress()

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}


const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 1300,
    minHeight: 1000,
    width: 1300,
    height: 1000,
    icon: getAssetPath('icon.png'),
    fullscreenable: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: false,
      webviewTag: true
    },
  });

  mainWindow.setMenu(null)

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }

    InstantiateExpress(mainWindow)
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on("before-input-event", (e, input) => {
    if(input.key === "`"){
      mainWindow?.webContents.send("switchTab")
      e.preventDefault()
    }
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

const readDir = (path: string) => {
  try {
    const files = fs.readdirSync(path)
    const images: ImageInfo[] = []
    for(let file of files){
      if(/\.png|\.jpg$/i.test(file)){
        images.push({ ...sizeOf(`${path + "/" + file}`), name: file, createdDate: fs.statSync(`${path + "/" + file}`).birthtimeMs, path: path + "\\" + file })
      }
    }
    images.sort((a, b) => (b.createdDate || 0) - (a.createdDate || 0))
    return { dirPath: path, images: images }
  } catch (error) {
    return { dirPath: path, images: [] }
  }
}

const chooseDirectory = async (e: IpcMainInvokeEvent) => {
  const { filePaths } = await dialog.showOpenDialog({ properties: ["openDirectory"] })
  if(filePaths.length > 0){
    return readDir(filePaths[0])
  }
  return ""
}

const onDirectoryChosen = (e: IpcMainInvokeEvent, path: string) => {
  return readDir(path)
}

const onRequestAssociatedFile = () => {
  return process.argv.find(path => /\.png|\.jpg$/.test(path)) || ""
}

const store = new Store()

ipcMain.on('onTransferAccepted', (e, images: string[]) => {
  setPermission({ accept: true, images })
})
ipcMain.on('onTransferDeclined', (e) => {
  setPermission({ accept: false, images: [] })
})
ipcMain.handle('getData', (event, key) => {
  return store.get(key)
})
ipcMain.on('setData', (event, key, data) => {
  store.set(key, data)
})
ipcMain.on('toggleFullScreen', (event: any, fullscreen: boolean) => {
  mainWindow?.setFullScreen(fullscreen)
})
ipcMain.handle("onRequestAssociatedFile", onRequestAssociatedFile)
ipcMain.handle("chooseDirectory", chooseDirectory)
ipcMain.handle("onDirectoryChosen", onDirectoryChosen)

// const instanceLock = app.requestSingleInstanceLock()

// if(!instanceLock){
//   app.quit()
// }else{
//   app.on('second-instance', (event, argv) => {
//     if(mainWindow){
//       if(/.png|.jpg$/i.test(argv[argv.length-1])){
//         mainWindow.webContents.send("onExternalFileOpen", argv[argv.length-1])
//       }
//       if(mainWindow.isMinimized()){
//         mainWindow.restore()
//       }
//       mainWindow.focus()
//     }
//   })
//   app.on('ready', () => {
//     createWindow()
//     app.on('activate', () => {
//       // On macOS it's common to re-create a window in the app when the
//       // dock icon is clicked and there are no other windows open.
//       if (mainWindow === null) createWindow();
//     });
//   })
// }

app.on('ready', () => {
  createWindow()
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
  });
})

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
