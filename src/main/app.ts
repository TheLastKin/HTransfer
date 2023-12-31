import { BrowserWindow, ipcMain } from "electron"
import fs from "fs"
import { Server } from "http"
import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from "body-parser"
import { TransferPermission } from "renderer/constant/types"

const app = express()
app.use(cors())
const server: Server = http.createServer(app)
const port = 4848;

const jsonParser = bodyParser.json()

let permission: TransferPermission | null = null
let url = ""

const setPermission = (p: TransferPermission) => {
  permission = p
}

const setURL = (u: string) => url = u

export { setPermission, setURL }

export default async function InstantiateExpress(mainWindow: BrowserWindow){

  server.on("error", () => {
    console.log("port is in use")
  })

  server.once('listening', () => {

    app.get('/transferRequest/:deviceName', jsonParser, (req, res) => {
      if(req.params.deviceName){
        mainWindow?.webContents.send("onTransferRequest", req.params.deviceName)
        let intervalCount = 0
        let intervalID = setInterval(() => {
          if(intervalCount*350 >= 20000){
            res.status(408).send("request timeout")
            clearInterval(intervalID)
          }
          if(permission?.accept){
            res.status(200).json({ name: permission.name, images: permission.images })
            permission = null
            clearInterval(intervalID)
          }
          if(permission?.accept === false){
            res.status(403)
            permission = null
            clearInterval(intervalID)
          }
          intervalCount++;
        }, 350)
      }else{
        res.send("should have a name")
      }
    })

    app.get('/getMedia/:mediaURL', jsonParser, (req, res) => {
      let mediaURL = req.params.mediaURL || "";
      if(mediaURL && fs.existsSync(mediaURL)){
        res.sendFile(mediaURL, (err) => {
          if(err){
            mainWindow?.webContents.send("onTransferError")
          }else{
            mainWindow?.webContents.send("onTransferSuccess")
          }
        })
      }else{
        mainWindow.webContents.send("FileNotExist")
        res.status(400).send("No file exists")
      }
    })

    app.get('/getURL', jsonParser, (req, res) => {
      res.send(url)
    })

  })

  server.listen(port, () => {
    console.log("example app running in port ", port)
  })
}
