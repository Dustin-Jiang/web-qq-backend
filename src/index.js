const express = require("express")
const app = express()
const { createClientItem } = require("./client")
const message = require("./message")

const account = [3599579486]
var accountList = {}

for (i of account) {
  accountList[i.toString()] = createClientItem(i)
}

app.get("/", (req, res) => {
  res.send("OICQ Backend")
})

//扫码后等待请求登录
app.get("/login/qrcode/:id", (req, res) => {
  client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.scanCode(req, res)
  }
})

app.get("/login/scan/:id", (req, res) => {
  client = accountList[req.params.id];
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    client.scanned(req, res)
  }
})

app.get("/user/:id/list/:type", (req, res) => {
  client = accountList[req.params.id].client;
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    if (req.params.type == "friend") res.send([...client.fl])
    if (req.params.type == "group") res.send([...client.gl]);
  }
})

app.get("/chat/:id/:type/:target/:date", (req, res) => {
  client = accountList[req.params.id];
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    message.get(client.uid, req.params.type, req.params.target, req.params.date, (result) => res.send(result))
  }
})

app.get("/history/pull/:id/:type/:target/:time", (req, res) => {
  client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    message.pull(client.client, req.params.type, req.params.target, req.params.time, (result) => res.send(result))
  }
})

app.listen(5000)