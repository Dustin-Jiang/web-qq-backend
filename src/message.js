const fs = require("fs");

function receive(uid, message) {
  d = new Date(message.time * 1000);
  date = d.getFullYear().toString() + (d.getMonth() + 1).toString() + d.getDate().toString();
  switch (message.message_type) {
    case "group":
      fs.readFile(`./src/data/${uid}/group/${message.group_id}/${date}.json`, "utf8", (err, data) => {
        if (err) {
          createFolder(`src/data/${uid}/group/${message.group_id}`);
          if (err.code == "ENOENT") { logs = []; } else { throw err; }
        } else { logs = (data == "") ? [] : JSON.parse(data); }
        //插入消息
        logs.push(filter(message));
        //按时间排序
        logs.sort(function (a, b) { return a.time - b.time; })
        //写入文件
        fs.writeFile(`./src/data/${uid}/group/${message.group_id}/${date}.json`, JSON.stringify(logs, null, 2), { "encoding": "utf8", "flag": "w" }, (err) => {
          if (err) throw err;
          return;
        });
      });
      break;
    case "private":
      fs.readFile(`./src/data/${uid}/private/${message.user_id}/${date}.json`, "utf8", (err, data) => {
        if (err) {
          createFolder(`src/data/${uid}/private/${message.user_id}`);
          if (err.code == "ENOENT") { logs = []; } else { throw err; }
        } else { logs = (data == "") ? [] : JSON.parse(data); }
        logs.push(filter(message));
        fs.writeFile(`./src/data/${uid}/private/${message.user_id}/${date}.json`, JSON.stringify(logs, null, 2), { "encoding": "utf8", "flag": "w" }, (err) => {
          if (err) throw err;
          return;
        });
      });
      break;
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

//Read File
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

function pull(client, type, target, time, callback) {
  if (typeof(callback) != "function") return ;
  uid = client.uin
  if (type == "friend") {
    friend = client.pickFriend(target)
    friend.getChatHistory(time).then(callback, (e) => console.log(e))
  }
  if (type == "group") {
    group = client.pickGroup(target)
    group.getChatHistory(time).then((result) => {
      // for(i of result) { receive(uid, i) }
      callback(result)
    }, (e) => console.log(e))
  }
}

exports.receive = receive;
exports.get = get;
exports.pull = pull;