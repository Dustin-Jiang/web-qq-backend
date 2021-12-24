const { createClient } = require("oicq")
const express = require("express")
const app = express()
const { createClientItem } = require("./client")

const account = [2752805684]
var accountList = {}

for (i of account) {
  accountList[i.toString()] = createClientItem(i)
}

app.get("/", (req, res) => {
  res.send("OICQ Backend")
})

app.listen(5000)