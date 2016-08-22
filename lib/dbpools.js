var mysql = require('mysql')
var connection = mysql.createConnection(
  require('../config.js').dbconn
)
connection.connect()

var dd = require('../lib/datesobj')
var datetimeformat_long  = '%b %d %Y %h:%i %p'
var datetimeformat_short = '%a %b %e %Y'
var datetimeformat_db    = '%Y-%m-%d %H:%i:%s'

exports.conn = connection

exports.usercredentials = function (paramsobj, fn) {
  var username = paramsobj.username
  connection.query(
    'SELECT `users`.`passhash`, HEX(`users`.`usertoken`) AS `usertoken`' +
    ' FROM `users`' +
    ' WHERE `users`.`username` = ? AND `users`.`active` = 1',
    [username],
    resultsThrough(fn, {first:true}) // get first record
  )
}

exports.usertokenvalid = function (paramsobj, fn) {
  var usertoken = paramsobj.usertoken
  connection.query(
    'SELECT HEX(`users`.`usertoken`) AS `usertoken`' +
    ' FROM `users`' +
    ' WHERE `users`.`usertoken` = UNHEX(?) AND `users`.`active` = 1',
    [usertoken],
    resultsThrough(fn, {first:true})
  )
}

exports.userinfo = function (usertoken, fn) {
  connection.query(
    'SELECT `email` FROM `users` WHERE HEX(`usertoken`) = ? AND `active` = true',
    [usertoken],
    resultsThrough(fn, {first:true})
  )
}

exports.userinfodid = function (statedid, fn) {
  connection.query(
    'SELECT HEX(`usertoken`) AS usertoken FROM `users` WHERE statedid = ? AND `active` = true',
    [statedid],
    resultsThrough(fn, {first:true})
  )
}

exports.pools = function (paramsobj, fn) {
  var usertoken = paramsobj.usertoken
  var active = paramsobj.active
  connection.query(
    'SELECT HEX(`pools`.`pooltoken`) AS `pooltoken`,' +
    ' CASE WHEN "" < `poolname` THEN `poolname` ELSE "untitled" END AS poolname, `pools`.`active`,' +
    ' DATE_FORMAT(`datetime_start`, "' + datetimeformat_short + '") AS `datetime_start`,' +
    ' DATE_FORMAT(`datetime_end`,   "' + datetimeformat_short + '") AS `datetime_end`,' +
    ' COUNT(`requests`.`pooltoken`) AS `requestscount`' +
    ' FROM `pools` LEFT JOIN `requests` USING (`pooltoken`)' +
    ' WHERE `pools`.`usertoken` = UNHEX(?) AND `pools`.`active` IN (?)' +
    //' AND (`requests`.`active` = true OR `requests`.`active` IS NULL)' +
    ' GROUP BY `pools`.`pooltoken`',
    [usertoken, active],
    resultsThrough(fn)
  )
}

exports.poolinfo = function (paramsobj, fn) {
  var pooltoken = paramsobj.pooltoken
  connection.query(
    'SELECT CASE WHEN "" < `poolname` THEN `poolname` ELSE "untitled" END AS poolname,' + 
    ' DATE_FORMAT(`datetime_start`,"' + datetimeformat_long + '") AS `datetime_start_long`,' +
    ' DATE_FORMAT(`datetime_end`,"' + datetimeformat_long + '") AS `datetime_end_long`,' +
    ' DATE_FORMAT(`datetime_start`,"' + datetimeformat_short + '") AS `datetime_start_short`,' +
    ' DATE_FORMAT(`datetime_end`,"' + datetimeformat_short + '") AS `datetime_end_short`,' +
    ' UNIX_TIMESTAMP(`datetime_start`) AS `datetime_start`,' +
    ' UNIX_TIMESTAMP(`datetime_end`) AS `datetime_end`' +
    ' FROM `pools` WHERE HEX(`pooltoken`) = ? AND `active` = true',
    [pooltoken],
    resultsThrough(fn, {first:true}) // get first record
  )
}

exports.poolsinactive = function (paramsobj, fn) {
  var usertoken = paramsobj.usertoken
  connection.query(
    'SELECT COUNT(*) cnt FROM `pools` WHERE `usertoken` = UNHEX(?) AND `active` != 1',
    [usertoken],
    resultsThrough(fn, {first:true}) // get first record
  )
}

exports.requests = function (paramsobj, fn) {
  var usertoken = paramsobj.usertoken,
  pooltoken = paramsobj.pooltoken,
  active = paramsobj.active
  connection.query(
    'SELECT `name`, `email`, `provisional`, `active`,' +
    ' DATE_FORMAT(`datetime`, "' + datetimeformat_db + '") AS `datetime`,' +
    ' DATE_FORMAT(`datetime`, "' + datetimeformat_long + '") AS `datetime_text`,' +
    ' coursenumber, coursename, universityname, coursetype, coursedegree' +
    ' FROM `requests`' +
    ' WHERE `usertoken` = UNHEX(?) AND HEX(`pooltoken`) = ? AND `active` IN (?) ORDER BY `datetime`',
    [usertoken, pooltoken, active],
    resultsThrough(fn)
  )
}

exports.requestsinactive = function (paramsobj, fn) {
  var usertoken = paramsobj.usertoken,
  pooltoken = paramsobj.pooltoken
  connection.query(
    'SELECT COUNT(*) cnt FROM `requests`' +
    ' WHERE `usertoken` = UNHEX(?) AND HEX(`pooltoken`) = ? AND `active` != 1',
    [usertoken, pooltoken],
    resultsThrough(fn, {first:true}) // get first record
  )
}

exports.poolinsert = function (paramsobj, fn) {
  var usertoken = paramsobj.usertoken, post = paramsobj.post
  connection.query(
    'INSERT INTO `pools` (`usertoken`, `poolname`, `datetime_start`, `datetime_end`)' +
    ' VALUES (UNHEX(?),?,?,?)',
    [
      usertoken,
      post.poolname,
      dd.dateAppendTime(post.datetime_start, '07:00:00'),
      dd.dateAppendTime(post.datetime_end, '23:59:59')
    ],
    resultsThrough(fn)
  )
}

exports.poolupdate = function (paramsobj, fn) {
  var usertoken = paramsobj.usertoken, pooltoken = paramsobj.pooltoken, post = paramsobj.post
  connection.query(
    'UPDATE pools SET `poolname` = ?,' + 
    ' `datetime_start` = ?, `datetime_end` = ?' +
    ' WHERE `usertoken` = UNHEX(?) AND HEX(`pooltoken`) = ?',
    [
      post.poolname, dd.dateAppendTime(post.datetime_start, '07:00:00'),
      dd.dateAppendTime(post.datetime_end, '23:59:59'),
      usertoken, pooltoken
    ],
    resultsThrough(fn)
  )
}

exports.poolcurr = function (paramsobj, fn) {
  var pooltoken = paramsobj.pooltoken
  connection.query(
    'SELECT HEX(`usertoken`) AS usertoken,' +
    ' CASE WHEN "" < `poolname` THEN `poolname` ELSE "untitled" END AS poolname,' +
    ' DATE_FORMAT(`datetime_start`, "' + datetimeformat_short + '") AS `datetime_start`,' + 
    ' DATE_FORMAT(`datetime_end`, "' + datetimeformat_short + '") AS `datetime_end`' + 
    ' FROM `pools` WHERE HEX(`pooltoken`) = ? AND `datetime_start` <= ? AND `datetime_end` >= ? AND `active` = true',
    [pooltoken, (paramsobj.startdate && dd.dateFormatEpoch(paramsobj.startdate)) || dd.nowdate, dd.nowdate],
    resultsThrough(fn, {first:true}) // get first record
  )
}

exports.poolnext = function (usertoken, fn) {
  connection.query(
    'SELECT CASE WHEN ? >= `datetime_start` THEN true ELSE false END AS current,' +
    ' `poolname`, HEX(`pooltoken`) AS pooltoken,' +
    ' DATE_FORMAT(`datetime_start`, "' + datetimeformat_short + '") AS datetime_start,' + 
    ' DATE_FORMAT(DATE_SUB(`datetime_start`, INTERVAL 1 DAY), "' + datetimeformat_short + '") AS datetime_provstart,' +
    ' DATE_FORMAT(`datetime_end`, "' + datetimeformat_short + '") AS datetime_end,' + 
    ' UNIX_TIMESTAMP(`datetime_start`) AS datetime_start_seconds,' +
    ' UNIX_TIMESTAMP(`datetime_end`) AS datetime_end_seconds, `active`' +
    ' FROM `pools` WHERE `datetime_end` >= ? AND `active` = true ORDER BY `datetime_start_seconds`',
    [dd.nowdate, dd.nowdate],
    resultsThrough(fn, {first:true}) // get first record
  )
}

exports.request = function (paramsobj, fn) {
  connection.query(
    'SELECT HEX(`pooltoken`) AS `pooltoken`, `name`, `email`, `provisional`, `coursenumber`, `coursename`,' + 
    ' `universityname`, `coursetype`, `coursedegree`, `datetime`' +
    ' FROM `requests` WHERE HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` LIKE ?',
    [paramsobj.pooltoken, paramsobj.email, dd.todaydate + ' %'],
    resultsThrough(fn, {first:true}) // get first record
  )
}

exports.requestinsert = function (paramsobj, fn) {
  var post = paramsobj.post, usertoken = paramsobj.usertoken
  connection.query(
    'INSERT INTO `requests` (`pooltoken`, `usertoken`, `email`, `name`, `provisional`,' +
    ' `coursenumber`, `coursename`, `universityname`, `coursetype`, `coursedegree`)' +
    ' VALUES (UNHEX(?),UNHEX(?),?,?,?,?,?,?,?,?)',
    [
      post.pooltoken, usertoken, post.email, post.name, post.provisional,
      post.coursenumber, post.coursename, post.universityname
      , post.coursetype, post.coursedegree
    ],
    resultsThrough(fn)
  )
}

/*/
exports.pooldeactivate = poolActivate(false)
exports.poolreactivate = poolActivate(true)

function poolActivate (activatebool) {
  return function (paramsobj, fn) {
    var usertoken = paramsobj.usertoken, post = paramsobj.post
    connection.query(
      'UPDATE `pools` SET `active` = ? WHERE `usertoken` = UNHEX(?) AND HEX(`pooltoken`) = ?',
      [activatebool, usertoken, post.pooltoken],
      resultsThrough(fn)
    )
  }
}//*/

exports.pooldelete = function (paramsobj, fn) {
  var token = paramsobj.token, post = paramsobj.post
  connection.query(
    'DELETE FROM `pools` WHERE `usertoken` = UNHEX(?) AND HEX(`pooltoken`) = ?',
    [token, post.pooltoken],
    resultsThrough(fn)
  )
}

exports.requestdeactivate = requestActivate(false)
exports.requestreactivate = requestActivate(true)

function requestActivate (activatebool) {
  return function (paramsobj, fn) {
    var token = paramsobj.token, post = paramsobj.post
    connection.query(
      'UPDATE `requests` SET `active` = ?' +
      ' WHERE `usertoken` = UNHEX(?) AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
      [activatebool, token, post.pooltoken, post.email, post.datetime],
      resultsThrough(fn)
    )
  }
}

exports.requestdelete = function (paramsobj, fn) {
  var token = paramsobj.token, post = paramsobj.post
  connection.query(
    'DELETE FROM `requests`' +
    ' WHERE `usertoken` = UNHEX(?) AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
    [token, post.pooltoken, post.email, post.datetime],
    resultsThrough(fn)
  )
}

exports.provisionaltoggle = function (paramsobj, fn) {
  var usertoken = paramsobj.usertoken, post = paramsobj.post
  connection.query(
    'UPDATE `requests` SET `provisional` = NOT `provisional`' +
    ' WHERE `usertoken` = UNHEX(?) AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
    [token, post.pooltoken, post.email, post.datetime],
    resultsThrough(fn)
  )
}

function resultsThrough (fn, opts) {
  opts = opts || {}
  return function (err, results) {
    results = opts.first? (results && results[0]) || undefined: results
    fn(err, results)
  }
}

