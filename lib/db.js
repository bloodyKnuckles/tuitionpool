var path = require('path')
var DB = require('sqlite3').Database
var fs = require('fs')
var path = require('path')
var db = new DB(path.join(__dirname, '../data'))

exports.db = db

exports.setup = function (cb) {
  if (!cb) cb = noop
  fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8', onread)

  function onread (err, src) {
    if (err) cb(err)
    db.run(src, cb)
  }
}

function noop () {}
