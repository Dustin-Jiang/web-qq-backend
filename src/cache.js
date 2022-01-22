const fs = require("fs")

var lastReadPath = ""
var lastReadContent = ""
var lastReadOptions = {}
var lastWritePath = ""
var lastWriteContent = ""
var lastWriteOptions = {}

function readFile (path, options, callback) {
  //Type check
  if (typeof(callback) != "function") throw new Error("TypeError: callback must be a function.")
  //Read from cache
  if (path == lastReadPath) {
    //If changed, apply changes
    if (lastReadPath == lastWritePath) {
      lastReadContent = lastWriteContent
    }
    callback("", lastReadContent)
  } else {
    // Set this time as the last
    lastReadPath = path
    lastReadOptions = options
    fs.readFile(path, options, (err, data) => {
      // Set this time as the last.
      // Waiting for next request.
      lastReadContent = data
      if (err) {
        lastReadPath = ""
        callback(err, data)
      }
      else callback("", data)
    })
  }
}

function writeFile (path, data, options, callback) {
  //Type check
  if (typeof(callback) != "function") throw new Error("TypeError: callback must be a function.")
  //Write to cache
  if (path == lastWritePath) {
    lastWriteContent = data
    callback()
  } else {
    //No cache
    if (lastWritePath !== "") {
      fs.writeFile(lastWritePath, lastWriteContent, lastWriteOptions, () => {
        // Set this time as the last.
        // Waiting for next request.
        lastWriteOptions = options;
        lastWriteContent = data
        lastWritePath = path
        callback()
      })
    } else {
      lastWriteOptions = options;
      lastWriteContent = data;
      lastWritePath = path
      callback()
    }
  }
}

exports.readFile = readFile
exports.writeFile = writeFile