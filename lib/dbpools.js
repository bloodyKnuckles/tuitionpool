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

exports.pools = function (paramsobj, fn) {
  var token = paramsobj.token,
  active = paramsobj.active
  connection.query(
  'SELECT HEX(`pools`.`pooltoken`) AS `pooltoken`, `poolname`, `pools`.`active`,' +
  ' DATE_FORMAT(`datetime_start`, "' + datetimeformat_short + '") AS `datetime_start`,' +
  ' DATE_FORMAT(`datetime_end`,   "' + datetimeformat_short + '") AS `datetime_end`,' +
  ' COUNT(`requests`.`pooltoken`) AS `requestscount`' +
  ' FROM `pools` LEFT JOIN `requests` USING (`pooltoken`)' +
  ' WHERE 1 = ? AND `pools`.`active` IN (?)' +
  ' AND (`requests`.`active` = true OR `requests`.`active` IS NULL)' +
  ' GROUP BY `pools`.`pooltoken`',
  [token, active],
  resultsThrough(fn)
  )
}

exports.poolinfo = function (paramsobj, fn) {
  var token = paramsobj.token, pooltoken = paramsobj.pooltoken
  connection.query(
  'SELECT `poolname`,' + 
  ' DATE_FORMAT(`datetime_start`,"' + datetimeformat_long + '") AS `datetime_start_long`,' +
  ' DATE_FORMAT(`datetime_end`,"' + datetimeformat_long + '") AS `datetime_end_long`,' +
  ' DATE_FORMAT(`datetime_start`,"' + datetimeformat_short + '") AS `datetime_start_short`,' +
  ' DATE_FORMAT(`datetime_end`,"' + datetimeformat_short + '") AS `datetime_end_short`,' +
  ' UNIX_TIMESTAMP(`datetime_start`) AS `datetime_start`,' +
  ' UNIX_TIMESTAMP(`datetime_end`) AS `datetime_end`' +
  ' FROM `pools` WHERE HEX(`pooltoken`) = ?',
  [pooltoken],
  resultsThrough(fn)
  )
}

exports.requests = function (paramsobj, fn) {
  var token = paramsobj.token,
  pooltoken = paramsobj.pooltoken,
  active = paramsobj.active
  connection.query(
  'SELECT `name`, `email`, `provisional`, active,' +
  ' DATE_FORMAT(`datetime`, "' + datetimeformat_db + '") AS `datetime`,' +
  ' DATE_FORMAT(`datetime`, "' + datetimeformat_long + '") AS `datetime_text`,' +
  ' (CASE provisional' + 
  '  WHEN 1 THEN DATE_FORMAT(DATE_SUB(datetime, INTERVAL 1 DAY),"' + datetimeformat_db + '")' + 
  '  ELSE DATE_FORMAT(datetime,"' + datetimeformat_db + '") END) AS datetime_prov,' +
  ' coursenumber, coursename, universityname, coursetype, coursedegree' +
  ' FROM `requests`' +
  ' WHERE 1 = ? AND HEX(`pooltoken`) = ? AND active IN (?) ORDER BY `datetime`', // `datetime_prov`',
  [token, pooltoken, active],
  resultsThrough(fn)
  )
}

exports.poolinsert = function (paramsobj, fn) {
  var token = paramsobj.token, post = paramsobj.post
  connection.query(
  'INSERT INTO `pools` (`pooltoken`, `poolname`, `datetime_start`, `datetime_end`)' +
  ' VALUES (ordered_uuid(uuid()),?,?,?)',
  //' VALUES (ordered_uuid(uuid()),?,FROM_UNIXTIME(?),FROM_UNIXTIME(?))',
  [
  // post datetime_start and end are timestamps
  post.poolname, dd.dateappendtime(post.datetime_start, '07:00:00'),
  dd.dateappendtime(post.datetime_end, '23:59:59')
  ],
  resultsThrough(fn)
  )
}

exports.poolupdate = function (paramsobj, fn) {
  var token = paramsobj.token, pooltoken = paramsobj.pooltoken, post = paramsobj.post
  connection.query(
  'UPDATE pools SET `poolname` = ?,' + 
  ' `datetime_start` = ?, `datetime_end` = ?' +
  //' `datetime_start` = FROM_UNIXTIME(?), `datetime_end` = FROM_UNIXTIME(?)' +
  ' WHERE 1 = ? AND HEX(`pooltoken`) = ?',
  [
  post.poolname, dd.dateappendtime(post.datetime_start, '07:00:00'),
  dd.dateappendtime(post.datetime_end, '23:59:59'),
  1, pooltoken
  ],
  resultsThrough(fn)
  )
}

exports.poolcurr = function (paramsobj, fn) {
  var pooltoken = paramsobj.pooltoken
  connection.query(
  'SELECT `poolname`, DATE_FORMAT(`datetime_start`, "' + datetimeformat_short + '") AS `datetime_start`,' + 
  ' DATE_FORMAT(`datetime_end`, "' + datetimeformat_short + '") AS `datetime_end`' + 
  ' FROM `pools` WHERE HEX(`pooltoken`) = ? AND `datetime_start` <= ? AND `datetime_end` >= ?',
  [pooltoken, dd.nowdate, dd.nowdate],
  resultsThrough(fn)
  )
}

exports.request = function (paramsobj, fn) {
  connection.query(
  'SELECT HEX(`pooltoken`) AS `pooltoken`, `name`, `email`, `provisional`, `coursenumber`, `coursename`,' + 
  ' `universityname`, `coursetype`, `coursedegree`, `datetime`' +
  ' FROM `requests` WHERE HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` LIKE ?',
  [paramsobj.pooltoken, paramsobj.email, dd.todaydate + ' %'],
  resultsThrough(fn)
  )
}

exports.requestinsert = function (paramsobj, fn) {
  var post = paramsobj.post
  connection.query(
  'INSERT INTO `requests` (`pooltoken`, `email`, `name`, `provisional`,' +
  ' `coursenumber`, `coursename`, `universityname`, `coursetype`, `coursedegree`)' +
  ' VALUES (UNHEX(?),?,?,?,?,?,?,?,?)',
  [
  post.pooltoken, post.email, post.name, post.provisional,
  post.coursenumber, post.coursename, post.universityname
  , post.coursetype, post.coursedegree
  ],
  resultsThrough(fn)
  )
}

exports.pooldeactivate = poolActivate(false)
exports.poolreactivate = poolActivate(true)

function poolActivate (activatebool) {
  return function (paramsobj, fn) {
  var token = paramsobj.token, post = paramsobj.post
  connection.query(
  'UPDATE `pools` SET active = ? WHERE 1 = ? AND HEX(`pooltoken`) = ?',
  [activatebool, token, post.pooltoken],
  resultsThrough(fn)
  )
  }
}

exports.pooldelete = function (paramsobj, fn) {
  var token = paramsobj.token, post = paramsobj.post
  connection.query(
  'DELETE FROM `pools` WHERE 1 = ? AND HEX(`pooltoken`) = ?',
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
  'UPDATE `requests` SET active = ?' +
  ' WHERE 1 = ? AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
  [activatebool, token, post.pooltoken, post.email, post.datetime],
  resultsThrough(fn)
  )
  }
}

exports.requestdelete = function (paramsobj, fn) {
  var token = paramsobj.token, post = paramsobj.post
  connection.query(
  'DELETE FROM `requests`' +
  ' WHERE 1 = ? AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
  [token, post.pooltoken, post.email, post.datetime],
  resultsThrough(fn)
  )
}

exports.provisionaltoggle = function (paramsobj, fn) {
  var token = paramsobj.token, post = paramsobj.post
  connection.query(
  'UPDATE `requests` SET `provisional` = NOT `provisional`' +
  ' WHERE 1 = ? AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
  [token, post.pooltoken, post.email, post.datetime],
  resultsThrough(fn)
  )
}

function resultsThrough (fn) {
  return function (err, results) { fn(err, results) }
}

