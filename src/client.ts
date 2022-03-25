exports.ClientItem = void 0
import { createClient } from "oicq"
import fs from "fs"
import * as message from "./message"
import { Request, Response } from "express"
import { Client } from "oicq"

export default class ClientItem {
  /**
   * Create a user client via `oicq.createClient()`.
   * @param {number} uid User QQ ID
   * @returns {ClientItem}
   */
  token: string
  uid: number
  client: Client
  isNowLogging: Boolean

  constructor(uid : number) {
    this.token = "This is a token"
    this.uid = uid

    this.client = createClient(uid, {platform: 2, ignore_self: false})
    this.client.on("system.online", () => console.log("Logged in!"))
    this.client.on("message", e => message.receive(this.uid, e as any))

    this.isNowLogging = false
  }
  login(){
    this.client.on("system.login.qrcode", () => {this.isNowLogging = true}).login()
  }
  /**
   * After user requests for login in, response the QR code pic.
   * @param {Express} req Request
   * @param {Express} res Response
   * @returns Respond the request or return if error
   */
  scanCode(req : Request, res : Response) {
    if(!this.isNowLogging) return;
    this.client.login()   // 刷新QR
    const rs = fs.createReadStream(`./dist/data/${req.params.id}/qrcode.png`);
    rs.pipe(res);
    rs.on("error", () => res.status(404).send("User Not Found"));
  }
  /**
   * After the QR code is scanned, to login in.
   * @param {Express} req Request
   * @param {Express} res Response
   * @returns Respond the request or return if error
   */
  scanned(req : Request, res : Response) {
    if (this.isNowLogging == false) return;
    this.client.login();
    this.client.on("internal.error.qrcode", (retcode, message) => {
      res.status(500).send(message);
    });
    this.client.on("system.online", () => {
      res.status(200).send()
      this.isNowLogging = false
    });
  }
  receive = message.receive
  send = message.send
  pull = message.pull
  get = message.get
}

function createClientItem(uid : number) {
  if (isNaN(Number(uid)))
    throw new Error(uid + " is not an OICQ account");
  return new ClientItem(Number(uid));
}

exports.createClientItem = createClientItem