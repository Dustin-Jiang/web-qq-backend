import { Request, Response } from "express"
import ClientItem from "./client"
const envConfig = require("../oicqConfig.json")
const cors = require("cors")

const express = require("express")
const app = express()
const { createClientItem } = require("./client")

import { FriendInfo, GroupInfo, GroupMessage, PrivateMessage } from "oicq"

const account = envConfig.loginList
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

/**
 * 获取用户通讯列表
 * 
 * @desperated Use `/user/:id/contact` instead.
 *  */ 
app.get("/user/:id/list/:type", (req : Request, res : Response) => {
  let client = accountList[req.params.id].client;
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    if (req.params.type == "friend") res.send([...Array(client.fl)])
    if (req.params.type == "group") res.send([...Array(client.gl)]);
  }
})

// 获取列表
/**
 * @api {get} /user/:id/contact
 * @apiName 获取列表
 * @apiParam {number} id 用户ID
 */

app.get("/user/:id/contact", (req: Request, res : Response) => {
  let client = accountList[req.params.id];
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    let result : any[] = [] //FIXME: Type needed
    let listFl = () : FriendInfo[] => {
      let result : FriendInfo[] = []
      for(let i of client.client.fl.values()) {
        result.push(i)
      }
      return result
    }
    let listGl = () : GroupInfo[] => {
      let result : GroupInfo[] = []
      for(let i of client.client.gl.values()) {
        result.push(i)
      }
      return result
    }
    for (let i of listFl()) {
      if (typeof i === "number") continue
      result.push(client.pull(
        client.client,
        "friend",
        i.user_id.toString(),
        "latest",
        (mes : PrivateMessage[]) => {result.push(mes)}
      ))
    }
    for (let i of listGl()) {
      if (typeof i === "number") continue
      result.push(client.pull(
        client.client,
        "group",
        i.group_id.toString(),
        "latest",
        (mes : GroupMessage[]) => {result.push(mes)}
      ))
    }

    res.send(result)
  }
})

// 获取用户昵称

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
      req.params.type as "group" | "private", 
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
      req.params.type as "group" | "friend", 
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
      req.params.type as "group" | "friend", 
      req.params.target, 
      req.params.content, 
      (result : any) => res.send(result)) // FIXME: Unknown `result` type. If it is a Promise?
  }
})

app.listen(envConfig.port[envConfig.env])