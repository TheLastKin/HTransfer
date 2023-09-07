import { ipcMain } from "electron"
import fs from "fs"
import { Server } from "http"
import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from "body-parser"

const app = express()
app.use(cors())
const server: Server = http.createServer(app)
const port = 4000;

const jsonParser = bodyParser.json()

export default function InstantiateExpress(){

  let activeStreamDir: string[] = []

  app.post('/streamImage', jsonParser, (req, res) => {
    const dirURL = req.body.dirURL || "";
    if(dirURL){
      if(activeStreamDir.includes(dirURL)){
        res.status(200).send({ status: true })
      }else {
        activeStreamDir.push(dirURL);
        app.use(dirURL.substring(2).replace(/\\/g, "/").replace(/ /g, "_"), express.static(dirURL))
        res.status(200).send({ status: true })
      }
    }else{
      res.status(400).send("No directory url")
    }
  })

  server.listen(port, () => {
    console.log("example app running in port ", port)
  })
}
