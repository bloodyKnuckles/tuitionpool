var mysql = require('mysql')
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'tuitionpool'
})
connection.connect()

var dd = require('../lib/datesobj')

exports.conn = connection

exports.pools = function (paramsobj, fn) {
    var token = paramsobj.token
    connection.query(
            'SELECT HEX(`pools`.`pooltoken`) AS `pooltoken`, `poolname`,' +
            ' DATE_FORMAT(`datetime_start`, "%a %b %e %Y") AS `datetime_start_text`,' +
            ' DATE_FORMAT(`datetime_end`,   "%a %b %e %Y") AS `datetime_end_text`,' +
            ' UNIX_TIMESTAMP(`datetime_start`) AS `datetime_start`,' +
            ' UNIX_TIMESTAMP(`datetime_end`) AS `datetime_end`,' +
            ' COUNT(`requests`.`pooltoken`) AS `requestscount`' +
            ' FROM `pools` LEFT JOIN `requests` USING (`pooltoken`)' +
            ' WHERE 1 = ? GROUP BY `pools`.`pooltoken`',
        [token], function(err, pools) {
            if (err) throw err;
            if ( !pools[0] ) {
                fn({results:[]})
            }
            else if ( pools[0] ) {
                pools = pools.map(function (poolinfo) {
                    return {
                        '.poolname': {
                            _text: poolinfo.poolname, 'href': '/pools/' + poolinfo.pooltoken
                        },
                        '.datetime_start_text': poolinfo.datetime_start_text,
                        '.datetime_end_text': poolinfo.datetime_end_text,
                        '.datetime_start': poolinfo.datetime_start_text,
                        '.datetime_end': poolinfo.datetime_end_text,
                        '.requestscount': poolinfo.requestscount
                    }
                })
                fn({results:pools})
            }
    })
}

exports.poolinfo = function (paramsobj, fn) {
    var token = paramsobj.token, pooltoken = paramsobj.pooltoken
    connection.query(
            'SELECT `poolname`,' + 
            ' DATE_FORMAT(`datetime_start`,"%b %d %Y %h:%i %p") AS `datetime_start_text`,' +
            ' DATE_FORMAT(`datetime_end`,"%b %d %Y %h:%i %p") AS `datetime_end_text`,' +
            ' UNIX_TIMESTAMP(`datetime_start`) AS `datetime_start`,' +
            ' UNIX_TIMESTAMP(`datetime_end`) AS `datetime_end`' +
            ' FROM `pools` WHERE 1 = ? AND HEX(`pooltoken`) = ?',
            [token, pooltoken], function(err, poolinfo) {
        if (err) throw err;
        if ( !poolinfo[0] ) {
            fn({results:[]})
        }
        else if ( poolinfo[0] ) {
            fn({results:poolinfo}) }
    })
}

exports.requests = function (paramsobj, fn) {
    var token = paramsobj.token, pooltoken = paramsobj.pooltoken,
        active1 = undefined === paramsobj.active
            ? true: Array.isArray(paramsobj.active)
                ?paramsobj.active[0]: paramsobj.active,
        active2 = undefined === paramsobj.active
            ? true: Array.isArray(paramsobj.active)
                ?paramsobj.active[1]: paramsobj.active
    connection.query(
            'SELECT `name`, `email`, `provisional`, active,' +
            ' DATE_FORMAT(`datetime`, "%a %b %e, %Y %H:%i:%s") AS `datetime_text`,' +
            ' DATE_FORMAT(`datetime`, "%Y-%m-%d %H:%i:%s") AS `datetime`,' +
            ' coursenumber, coursename, universityname, coursetype, coursedegree' +
            ' FROM `requests`' +
            ' WHERE 1 = ? AND HEX(`pooltoken`) = ? AND active IN (?,?) ORDER BY `datetime`',
            [token, pooltoken, active1, active2], function(err, requests) {
        if (err) throw err;
        if ( !requests[0] ) {
            fn({results:[]})
        }
        else if ( requests[0] ) {
            requests = requests.map(function (request) {
                var retrequest = {
                    'td': {class:{append: request.active? '': ' strikeme'}},
                    '.name': request.name,
                    '.email': request.email,
                    '.datetime_text': request.datetime_text,
                    '.datetime': request.datetime,
                    '.coursenumber': request.coursenumber,
                    '.coursename': request.coursename,
                    '.universityname': ' - ' + request.universityname,
                    '.coursetype': request.coursetype,
                    '.coursedegree': request.coursedegree? 'degree': ''
                }
                retrequest['.provisional'] = 1 === request.provisional
                    ? { checked: 'checked'}: ''
                return retrequest
            })
            fn({results:requests})
        }
    })
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
            ], function(err, poolinsert) {
        if (err) throw err;
        fn({results:poolinsert})
    })
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
            ], function(err, poolinsert) {
        if (err) throw err;
        fn({results:poolinsert})
    })
}

exports.poolcurr = function (paramsobj, fn) {
    var pooltoken = paramsobj.pooltoken
    connection.query(
        'SELECT `poolname`, DATE_FORMAT(`datetime_start`, "%a %b %e %Y") AS `datetime_start`,' + 
        ' DATE_FORMAT(`datetime_end`, "%a %b %e %Y") AS `datetime_end`' + 
        ' FROM `pools` WHERE HEX(`pooltoken`) = ? AND `datetime_start` <= ? AND `datetime_end` >= ?',
            [pooltoken, dd.nowdate, dd.nowdate], function(err, poolinfo) {
        if (err) throw err;
        if ( !poolinfo[0] ) {
            fn({results:[]})
        }
        else if ( poolinfo[0] ) {
            fn({results:poolinfo})
        }
    })
}

exports.poolinfo = function (paramsobj, fn) {
    var pooltoken = paramsobj.pooltoken
    connection.query(
        'SELECT `poolname`, DATE_FORMAT(`datetime_start`, "%a %b %e %Y") AS `datetime_start`,' + 
        ' DATE_FORMAT(`datetime_end`, "%a %b %e %Y") AS `datetime_end`' + 
        ' FROM `pools` WHERE HEX(`pooltoken`) = ?',
            [pooltoken], function(err, poolinfo) {
        if (err) throw err;
        if ( !poolinfo[0] ) {
            fn({results:[]})
        }
        else if ( poolinfo[0] ) {
            fn({results:poolinfo})
        }
    })
}

exports.request = function (paramsobj, fn) {
    connection.query(
        'SELECT HEX(`pooltoken`) AS `pooltoken`, `name`, `email`, `provisional`, `coursenumber`, `coursename`,' + 
        ' `universityname`, `coursetype`, `coursedegree`, `datetime`' +
        ' FROM `requests` WHERE HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` LIKE ?',
            [paramsobj.pooltoken, paramsobj.email, dd.todaydate + ' %'], function(err, request) {
        if (err) throw err;
        if ( !request[0] ) {
            fn({results:[]})
        }
        else if ( request[0] ) {
            fn({results:request})
        }
    })
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
            ], function(err, requestinsert) {
            fn({results:requestinsert, err:err})
    })
}

exports.requestdeactivate = function (paramsobj, fn) {
    var token = paramsobj.token, post = paramsobj.post
    connection.query(
       'UPDATE `requests` SET active = false' +
       ' WHERE 1 = ? AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
            [
                token, post.pooltoken, post.email, post.datetime
            ], function(err, requestdeactivate) {
            fn({results:requestdeactivate, err:err})
    })
}

exports.requestreactivate = function (paramsobj, fn) {
    var token = paramsobj.token, post = paramsobj.post
    connection.query(
        'UPDATE `requests` SET active = true' +
        ' WHERE 1 = ? AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
            [
                token, post.pooltoken, post.email, post.datetime
            ], function(err, requestreactivate) {
            fn({results:requestreactivate, err:err})
    })
}

exports.requestdelete = function (paramsobj, fn) {
    var token = paramsobj.token, post = paramsobj.post
    connection.query(
        'DELETE FROM `requests`' +
        ' WHERE 1 = ? AND HEX(`pooltoken`) = ? AND `email` = ? AND `datetime` = ?',
            [
                token, post.pooltoken, post.email, post.datetime
            ], function(err, requestdelete) {
            fn({results:requestdelete, err:err})
    })
}


