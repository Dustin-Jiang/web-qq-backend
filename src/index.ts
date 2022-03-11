import { Request, Response } from "express"
import ClientItem from "./client"
const cors = require("cors")

const express = require("express")
const app = express()
const { createClientItem } = require("./client")

const account = [3599579486, 2752805684]
interface Accounts {
  [index: string]: ClientItem
}
var accountList : Accounts = {}

for (let i of account) {
  accountList[i.toString()] = createClientItem(i)
}

app.use(cors())

app.get("/", (req : Request, res : Response) => {
  res.send("OICQ Backend")
})

//扫码后等待请求登录
app.get("/login/qrcode/:id", (req : Request, res : Response) => {
  let client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.scanCode(req, res)
  }
})

app.get("/login/request/:id", (req : Request, res : Response) => {
  let client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.login();
    client.client.once("system.login.qrcode", () => res.status(403).send("Please scan code."))
    client.client.once("system.online", () => res.status(200).send())
  }
})

app.get("/login/scan/:id", (req : Request, res : Response) => {
  let client = accountList[req.params.id];
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    client.scanned(req, res)
  }
})

app.get("/user/:id/list/:type", (req : Request, res : Response) => {
  let client = accountList[req.params.id].client;
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    if (req.params.type == "friend") res.send([...Array(client.fl)])
    if (req.params.type == "group") res.send([...Array(client.gl)]);
  }
})

app.get("/client/nickname/:id", (req : Request, res : Response) => {
  let client = accountList[req.params.id].client;
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    res.send(client.nickname)
  }
})

app.get("/chat/:id/:type/:target/:date", (req : Request, res : Response) => {
  let client = accountList[req.params.id];
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    client.get(
      client.uid, 
      req.params.type, 
      req.params.target, 
      req.params.date, 
      (result : any) => res.send(result)) // FIXME: Unknown `result` type. If it is a Promise?
  }
})

app.get("/history/pull/:id/:type/:target/:time", (req : Request, res : Response) => {
  let client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.pull(
      client.client, 
      req.params.type, 
      req.params.target, 
      req.params.time, 
      (result : string) => res.send(result))
  }
})

app.get("/send/text/:id/:type/:target/:content", (req : Request, res : Response) => {
  let client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.send(
      client.client, 
      req.params.type, 
      req.params.target, 
      req.params.content, 
      (result : any) => res.send(result)) // FIXME: Unknown `result` type. If it is a Promise?
  }
})

app.listen(5000)