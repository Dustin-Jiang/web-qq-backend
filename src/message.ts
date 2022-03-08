import { Client, GroupMessage, Message, PrivateMessage } from "oicq";

const fs = require("fs");

/**
 * Write message to the history file when receive a new message. 
 * @param {Number} uid Client uid. 
 * @param {ociq.Message} message `oicq.Message` object contains the new message. 
 */
function receive(uid, message) {
  let d = new Date(message.time * 1000);
  let date = getDate(d);
  let filepath = getHistoryFileUrl(uid, message, date)
  fs.readFile(filepath, "utf8", (err, data) => {
    let logs
    if (err) {
      createFolder(`src/data/${uid}/group/${message.group_id}`);
      if (err.code == "ENOENT") { logs = []; } else { throw err; }
    } else { logs = (data == "") ? [] : JSON.parse(data); }
    //插入消息
    logs.push(filter(message));
    //按时间排序
    logs.sort(function (a, b) { return a.time - b.time; })
    //写入文件
    fs.writeFile(filepath, JSON.stringify(logs, null, 2), { "encoding": "utf8", "flag": "w" }, (err) => {
      if (err) throw err;
      return;
    });
  });
}

function getDate(d : Date) : String {
  let month = (d.getMonth() + 1).toString()
  if (month.length == 1) month = "0" + month
  let date = d.getDate().toString();
  if (date.length == 1) date = "0" + date
  return d.getFullYear().toString() + month + date
}

function getHistoryFileUrl(
  uid: String | Number,
  message: GroupMessage | PrivateMessage,
  date: String
): String {
  if (message instanceof PrivateMessage)
    return `./src/data/${uid}/private/${message.user_id}/${date}.json`
  else if (message instanceof GroupMessage)
    return `./src/data/${uid}/group/${message.group_id}/${date}.json`
}

function createFolder(path : String) {
  var pwd = ".";
  for (let i of path.split("/")) {
    try {
      fs.mkdirSync(pwd + "/" + i);
      pwd += "/" + i;
      continue;
    } catch (err) {
      pwd += "/" + i;
      continue;
    }
  }
}

function filter(obj : Object) : Object {
  let deleteList = [
    "font",
    "rand",
    "auto_reply",
    "group",
    "member",
    "friend",
    "to_id",
    "from_id"
  ];
  for (let i of deleteList) {
    delete obj[i];
  }
  return obj;
}

/**
 * Get a specific file. 
 * @param {Number} uid User QQ ID.
 * @param {"group" | "private"} type Message type.
 * @param {String} target Chat target user needs.
 * @param {String} file File needs.
 * @param {Function} callback Callback
 * @returns 
 */
function get(uid, type, target, file, callback) {
  if (typeof(callback) != "function") return;
  let fileList = []
  fs.readdir(`./src/data/${uid}/${type}/${target}`, (err, data) => {
    if (err) return fileList;
    fileList = data;
    if (file != undefined && file != "-1") {
      fileList = fileList.slice(0, fileList.indexOf(file))
    }
    file = fileList.pop()
    fs.readFile(`./src/data/${uid}/${type}/${target}/${file}`, "utf8", (err, data) => {
      if (err) throw err;
      callback({
        "file": file,
        "content": JSON.parse(data)
      })
    })
  })
}

/**
 * Pull history from Tencent.
 * @param {oicq.Client} client An object of `oicq.Client`. 
 * @param {"friend" | "group"} type 
 * @param {String} target 
 * @param {String} time 
 * @param {Function} callback 
 * @returns 
 */
function pull(client : Client, type, target, time, callback) {
  if (typeof(callback) != "function") return ;
  let uid = client.uin
  if (type == "friend") {
    let friend = client.pickFriend(target)
    friend.getChatHistory(time).then(callback, (e) => console.log(e))
  }
  if (type == "group") {
    let group = client.pickGroup(target)
    group.getChatHistory(time).then((result) => {
      // for(i of result) { receive(uid, i) }
      callback(result)
    }, (e) => console.log(e))
  }
}

/**
 * 
 * @param {oicq.client} client A QQ Client
 * @param {"friend" | "group"} type Message Type.
 * @param {String} target Message target.
 * @param {String | MessageElem} message Message Content.
 */
function send(client, type, target, message, callback) {
  if (typeof(callback) != "function") return;
  if (type in ["friend", "Friend"]) {
    let friend = client.pickFriend(target)
    callback(friend.sendMsg(message))
  }
  if (type in ["group", "Group"]) {
    let group = client.pickGroup(target)
    callback(group.sendMsg(message))
  }
}

exports.send = send;
exports.receive = receive;
exports.get = get;
exports.pull = pull;