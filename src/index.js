const { createClient } = require("oicq")
const express = require("express")
const app = express()
const fs = require("fs")

const account = [2752805684]
var accountList = {}

for (i of account) {
  var client = createClient(account, {platform: 2})

  client.on("system.online", () => console.log("Logged in!"))
  client.on("message", e => {
    console.log(e)
    // e.reply("hello world", true) //true表示引用对方的消息
  })

  client.on("system.login.qrcode", function (e) {
    //扫码后等待请求登录
    app.get("/login/qrcode/:id", (req, res) => {
      const rs = fs.createReadStream(`./src/data/${req.params.id}/qrcode.png`)
      rs.pipe(res)
      rs.on("error", () => res.status(404).send("User Not Found"))
    })
    app.get("/login/scan", (req, res) => {
      console.log("Finish Scanning")
      client.login()
      client.on("internal.error.qrcode", (retcode, message) => {
        res.status(500).send(message)
      })
      client.on("system.online", () => res.status(200).send())
    })
  }).login()

  accountList[i.toString()] = client
}

app.get("/", (req, res) => {
  res.send("OICQ Backend")
})

app.listen(5000)