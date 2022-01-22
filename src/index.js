const express = require("express")
const app = express()
const { createClientItem } = require("./client")

const account = [3599579486, 2752805684]
var accountList = {}

for (i of account) {
  accountList[i.toString()] = createClientItem(i)
}

app.get("/", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send("OICQ Backend")
})

//扫码后等待请求登录
app.get("/login/qrcode/:id", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.scanCode(req, res)
  }
})

app.get("/login/request/:id", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.login();
    client.client.once("system.login.qrcode", () => res.status(403).send("Please scan code."))
    client.client.once("system.online", () => res.status(200).send())
  }
})

app.get("/login/scan/:id", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  client = accountList[req.params.id];
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    client.scanned(req, res)
  }
})

app.get("/user/:id/list/:type", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  client = accountList[req.params.id].client;
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    if (req.params.type == "friend") res.send([...client.fl])
    if (req.params.type == "group") res.send([...client.gl]);
  }
})

app.get("/client/nickname/:id", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  client = accountList[req.params.id].client;
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    res.send(client.nickname)
  }
})

app.get("/chat/:id/:type/:target/:date", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  client = accountList[req.params.id];
  if (client == undefined) {
    res.status(404).send("User Not Found");
  } else {
    client.get(client.uid, req.params.type, req.params.target, req.params.date, (result) => res.send(result))
  }
})

app.get("/history/pull/:id/:type/:target/:time", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.pull(client.client, 
      req.params.type, 
      req.params.target, 
      req.params.time, 
      (result) => res.send(result)
    )
  }
})

app.get("/send/text/:id/:type/:target/:content", (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  client = accountList[req.params.id]
  if (client == undefined) {
    res.status(404).send("User Not Found")
  } else {
    client.send(client.client, req.params.type, req.params.target, req.params.content, (result) => res.send(result))
  }
})

app.listen(5000)