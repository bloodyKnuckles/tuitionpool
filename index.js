var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

var router = require('./lib/router.js')
var ecstatic = require('ecstatic')
var body = require('body/any')
var path = require('path')
var fs = require('fs')
var hstream = require('hyperstream')
var xtend = require('xtend')
var createElement = require('virtual-dom/create-element')
//var mysql = require('mysql')
var str = require('string-to-stream')

//var connection = mysql.createConnection({
//  host     : 'localhost',
//  user     : 'root',
//  password : '',
//  database : 'test'
//})
//connection.connect();
//connection.query('SELECT * FROM test', function(err, rows, fields) {
//  if (err) throw err;
//console.log('The solution is: ', rows[0].text);
//})


inherits(Server, EventEmitter)
module.exports = Server

function Server (opts) {
    if (!(this instanceof Server)) return new Server(opts)
    if (!opts) opts = {}
    this.st = ecstatic(path.join(__dirname, 'public'))
}

Server.prototype.handle = function (req, res) {
    var r, m = router.match(req.url)
    var mx = xtend(m, { state: { url: req.url } })
    if ( m && 'POST' === req.method ) {
        body(req, res, function (err, pvars) {
            mx = xtend(mx, { params: xtend(mx.params, pvars) })
            r = m.fn(mx, res)
        })
    }
    else if (m) {
        r = m.fn(mx, res)
    } else this.st(req, res)
}

Server.prototype.createStream = function () {
    // websocket feed goes here
}

Server.prototype.setup = function (cb) {
    //db.setup(cb)
}
  
//function read (file) {
//    return fs.createReadStream(path.join(__dirname, 'public', file))
//}

