exports.ClientItem = void 0
const { createClient } = require("oicq")
const express = require("express")
const app = express()
const fs = require("fs")
const message = require("./message")

class ClientItem {
  constructor(uid) {
    this.token = "This is a token"
    this.uid = uid

    this.client = createClient(uid, {platform: 2, ignore_self: false})
    this.client.on("system.online", () => console.log("Logged in!"))
    this.client.on("message", e => message.receive(this.uid, e))

    this.logging = false

    this.client.on("system.login.qrcode", () => this.logging = true).login()
  }
  scanCode(req, res) {
    if(this.logging == false) return;
    const rs = fs.createReadStream(`./src/data/${req.params.id}/qrcode.png`);
    rs.pipe(res);
    rs.on("error", () => res.status(404).send("User Not Found"));
  }
  scanned(req, res) {
    if (this.logging == false) return;
    this.client.login();
    this.client.on("internal.error.qrcode", (retcode, message) => {
      res.status(500).send(message);
    });
    this.client.on("system.online", () => {
      res.status(200).send()
      this.logging = false
    });
  }
}

function createClientItem(uid) {
  if (isNaN(Number(uid)))
    throw new Error(uid + " is not an OICQ account");
  return new ClientItem(Number(uid));
}

exports.createClientItem = createClientItem