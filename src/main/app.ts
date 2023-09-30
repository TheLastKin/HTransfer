// import { ipcMain } from "electron"
// import fs from "fs"
// import { Server } from "http"
// import express from 'express'
// import http from 'http'
// import cors from 'cors'
// import bodyParser from "body-parser"

// const app = express()
// app.use(cors())
// const server: Server = http.createServer(app)
// const port = 4000;

// const jsonParser = bodyParser.json()

// const detectAssociatedFile = () => {
//   let imagePath = process.argv.find(path => /\.png|\.jpg$/.test(path));
//   if(imagePath){
//     let folderPath = imagePath.substring(0, imagePath.lastIndexOf("\\"))
//     fetch('http://localhost:4000/streamImage', {
//       method: 'POST',
//       mode: 'cors',
//       headers: {
//         'Content-Type': 'application/json',
//         'Allow-Control-Access-Origin': '*',
//       },
//       body: JSON.stringify({ dirURL: folderPath }),
//     });
//   }
// }

// export default async function InstantiateExpress(){

//   server.on("error", () => {

//   })

//   server.once('listening', () => {
//     let activeStreamDir: string[] = []

//     app.post('/streamImage', jsonParser, (req, res) => {
//       const dirURL = req.body.dirURL || "";
//       if(dirURL){
//         if(activeStreamDir.includes(dirURL)){
//           res.status(200).send({ status: true })
//         }else {
//           activeStreamDir.push(dirURL);
//           app.use(dirURL.substring(2).replace(/\\/g, "/").replace(/ /g, "%20"), express.static(dirURL))
//           res.status(200).send({ status: true })
//         }
//       }else{
//         res.status(400).send("No directory url")
//       }
//     })

//     detectAssociatedFile()
//   })

//   server.listen(port, () => {
//     console.log("example app running in port ", port)
//   })
// }
