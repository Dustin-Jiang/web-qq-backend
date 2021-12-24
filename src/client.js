exports.ClientItem = void 0
const { createClient } = require("oicq")
const express = require("express")
const app = express()
const fs = require("fs")

class ClientItem {
  constructor(uid) {
    this.token = "This is a token"

    this.client = createClient(uid)
    this.client.on("system.online", () => console.log("Logged in!"))
    this.client.on("message", e => {
      console.log(e)
      // e.reply("hello world", true) //true表示引用对方的消息
    })

    this.client.on("system.login.qrcode", function (e) {
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
      })
    }).login()
  }
}

function createClientItem(uid) {
  if (isNaN(Number(uid)))
    throw new Error(uid + " is not an OICQ account");
  return new ClientItem(Number(uid));
}

exports.createClientItem = createClientItem