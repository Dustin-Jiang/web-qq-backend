const fs = require("fs");

/**
 * Write message to the history file when receive a new message. 
 * @param {Number} uid Client uid. 
 * @param {ociq.Message} message `oicq.Message` object contains the new message. 
 */
function receive(uid, message) {
  d = new Date(message.time * 1000);
  date = getDate(d);
  filepath = getHistoryFileUrl(uid, message.message_type, message, date)
  fs.readFile(filepath, "utf8", (err, data) => {
    if (err) {
      folderpath = filepath.split("/")
      folderpath.pop()
      folderpath.shift()
      folderpath = folderpath.join("/")
      createFolder(folderpath);
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

function getDate(d) {
  month = (d.getMonth() + 1).toString()
  if (month.length == 1) month = "0" + month
  date = d.getDate().toString();
  if (date.length == 1) date = "0" + date
  return d.getFullYear().toString() + month + date
}

function getHistoryFileUrl(uid, type, message, date) {
  switch(type) {
    case "private":
      return `./src/data/${uid}/${type}/${message.user_id}/${date}.json`
    case "group":
      return `./src/data/${uid}/${type}/${message.group_id}/${date}.json`
  }
}

function createFolder(path) {
  var pwd = ".";
  for (i of path.split("/")) {
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

function filter(obj) {
  deleteList = [
    "font",
    "rand",
    "auto_reply",
    "group",
    "member",
    "friend",
    "to_id",
    "from_id"
  ];
  for (i of deleteList) {
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
  fileList = []
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
 * @param {oicq.client} client An object of `oicq.client`. 
 * @param {"friend" | "group"} type 
 * @param {String} target 
 * @param {String} time 
 * @param {Function} callback 
 * @returns 
 */
function pull(client, type, target, time, callback) {
  if (typeof(callback) != "function") return ;
  uid = client.uin
  if (time == "latest") {
    if (type == "friend") {
      friend = client.pickFriend(target);
      friend.getChatHistory().then((result) => {
        callback(result)
      }, (e) => console.log(e));
    }
    if (type == "group") {
      group = client.pickGroup(target);
      group.getChatHistory().then((result) => {
        // for(i of result) { receive(uid, i) }
        callback(result);
      }, (e) => console.log(e));
    }
  }
  else {
    if (type == "friend") {
      friend = client.pickFriend(target);
      friend.getChatHistory(time).then(callback, (e) => console.log(e));
    }
    if (type == "group") {
      group = client.pickGroup(target);
      group.getChatHistory(time).then((result) => {
        // for(i of result) { receive(uid, i) }
        callback(result);
      }, (e) => console.log(e));
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
function send(client, type, target, message, callback) {
  if (typeof(callback) != "function") return;
  if (type == "friend") {
    friend = client.pickFriend(target)
    callback(friend.sendMsg(message))
  }
  if (type == "group") {
    group = client.pickGroup(target)
    callback(group.sendMsg(message))
  }
}

exports.send = send;
exports.receive = receive;
exports.get = get;
exports.pull = pull;