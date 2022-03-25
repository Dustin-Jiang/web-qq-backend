import { Client, GroupMessage, MessageElem, PrivateMessage } from "oicq";

import fs, { PathOrFileDescriptor } from "fs";

/**
 * Write message to the history file when receive a new message. 
 * @param {Number} uid Client uid. 
 * @param {ociq.Message} message `oicq.Message` object contains the new message. 
 */
export function receive(uid : number, message : GroupMessage | PrivateMessage)  {
  let d = new Date(message.time * 1000);
  let date = getDate(d);
  let filepath = getHistoryFileUrl(uid, message, date)
  fs.readFile(filepath as PathOrFileDescriptor, "utf8", (err, data) => {
    let folderpath : string[]
    let logs : object[]
    // TODO: 搞清楚这里创建文件夹逻辑 目前先解决TS类型
    if (err) {
      folderpath = filepath.split("/")
      folderpath.pop()
      folderpath.shift()
      let folder = folderpath.join("/")
      createFolder(folder);
      if (err.code == "ENOENT") { logs = []; } else { throw err; }
    } else { logs = (data == "") ? [] : JSON.parse(data); }
    //插入消息
    logs.push(filter(message));
    // 按时间排序
    // `any` 指排序时前后项
    logs.sort(function (a : any , b : any) { return a.time - b.time; })
    //写入文件
    fs.writeFile(filepath as PathOrFileDescriptor, JSON.stringify(logs, null, 2), { "encoding": "utf8", "flag": "w" }, (err) => {
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
  let result = ""
  if (message instanceof PrivateMessage)
    result = `./dist/data/${uid}/private/${message.user_id}/${date}.json`
  else if (message instanceof GroupMessage)
    result = `./dist/data/${uid}/group/${message.group_id}/${date}.json`
  return result
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

function filter(obj : PrivateMessage | GroupMessage) : object {
  // To fix index problem in TypeScript
  let a = obj as {
    [index: string]: any
  }
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
    delete a[i];
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
export function get(
  uid : number,
  type : "group" | "private",
  target : string,
  file : string,
  callback : Function
  ) {
  let fileList : string[]
  fs.readdir(`./dist/data/${uid}/${type}/${target}`, (err, data) => {
    // 获取目标账号下目录
    if (err) return fileList;
    fileList = data;
    if (file != undefined && file != "-1") {
      fileList = fileList.slice(0, fileList.indexOf(file))
    }
    // Type Safety
    // Make sure the type of `file` is string.
    file = (fileList[fileList.length - 1] === undefined) ? "" : fileList.pop() as string
    fs.readFile(`./dist/data/${uid}/${type}/${target}/${file}`, "utf8", (err, data) => {
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
export function pull(
  client: Client,
  type: "friend" | "group",
  target: string,
  time: string,
  callback: any) { //FIXME: The type of `callback` need to be fixed.
  if (typeof (callback) != "function") return;
  let uid = client.uin
  if (time == "latest") { // 获取最新消息
    if (type == "friend") {
      let friend = client.pickFriend(parseInt(target));
      friend.getChatHistory().then((result) => {
        callback(result)
      }, (e) => console.log(e));
    }
    if (type == "group") {
      let group = client.pickGroup(parseInt(target));
      group.getChatHistory().then((result) => {
        // for(i of result) { receive(uid, i) }
        callback(result);
      }, (e) => console.log(e));
    }
  }
  else {
    if (type == "friend") {
      let friend = client.pickFriend(parseInt(target))
      friend.getChatHistory(parseInt(time)).then(callback, (e) => console.log(e))
    }
    if (type == "group") {
      let group = client.pickGroup(parseInt(target))
      group.getChatHistory(parseInt(time)).then((result) => {
        // for(i of result) { receive(uid, i) }
        callback(result.toString())
      }, (e) => console.log(e))
    }
  }
}

/**
 * 
 * @param {oicq.client} client A QQ Client
 * @param {"friend" | "group"} type Message Type.
 * @param {String} target Message target.
 * @param {String | MessageElem} message Message Content.
 */
export function send(
  client : Client, 
  type : "friend" | "group", 
  target : string, 
  message : string | MessageElem, 
  callback : any) { // FIXME: Type need to be fixed
  if (typeof(callback) != "function") return;
  if (type in ["friend", "Friend"]) {
    let friend = client.pickFriend(parseInt(target))
    callback(friend.sendMsg(message))
  }
  if (type in ["group", "Group"]) {
    let group = client.pickGroup(parseInt(target))
    callback(group.sendMsg(message))
  }
}