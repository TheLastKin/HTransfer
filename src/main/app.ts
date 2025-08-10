import { BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';
import { Server } from 'http';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { TransferPermission } from 'renderer/constant/types';
import os from 'os';

const app = express();
app.use(cors());
const server: Server = http.createServer(app);
const port = 4848;

const jsonParser = bodyParser.json();

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address; // ex: 192.168.1.5
      }
    }
  }
  return 'localhost';
};

let permission: TransferPermission | null = null;
let url = '';

const setPermission = (p: TransferPermission) => {
  permission = p;
};

const setURL = (u: string) => (url = u);

export { setPermission, setURL };

export default async function InstantiateExpress(mainWindow: BrowserWindow) {
  server.on('error', () => {
    console.log('port is in use');
  });

  server.once('listening', () => {
    app.get('/transferRequest/:deviceName', jsonParser, (req, res) => {
      if (req.params.deviceName) {
        mainWindow?.webContents.send(
          'onTransferRequest',
          req.params.deviceName
        );
        let intervalCount = 0;
        let intervalID = setInterval(() => {
          if (intervalCount * 350 >= 20000) {
            res.status(408).send('request timeout');
            clearInterval(intervalID);
          }
          if (permission?.accept) {
            res
              .status(200)
              .json({ name: permission.name, images: permission.images });
            permission = null;
            clearInterval(intervalID);
          }
          if (permission?.accept === false) {
            res.status(403);
            permission = null;
            clearInterval(intervalID);
          }
          intervalCount++;
        }, 350);
      } else {
        res.send('should have a name');
      }
    });

    app.get('/getMedia', jsonParser, (req, res) => {
      let mediaURL = (req.query as any).mediaURL || '';
      if (mediaURL && fs.existsSync(mediaURL)) {
        const stats = fs.statSync(mediaURL);
        const fileSize = stats.size;
        console.log(mediaURL)
        let fileExtension = (mediaURL as string).slice(
          (mediaURL as string).lastIndexOf('.') + 1
        );
        res.setHeader('Content-Type', `image/${fileExtension}`);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Length', fileSize);
        fs.createReadStream(mediaURL).pipe(res);
      } else {
        mainWindow.webContents.send('FileNotExist');
        res.status(400).send('No file exists');
      }
    });

    app.get('/getVideo', (req, res) => {
      const stat = fs.statSync(url);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(url, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        });

        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        });
        fs.createReadStream(url).pipe(res);
      }
    });
  });

  server.listen(port, () => {
    console.log('server address:', `http://${getLocalIP()}:${port}`);
  });
}
