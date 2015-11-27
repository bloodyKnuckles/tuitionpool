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
            'SELECT HEX(`pools`.`pool`) AS `pool`, `poolname`,' +
            ' DATE_FORMAT(`datetime_start`, "%a %b %e %Y") AS `datetime_start_text`,' +
            ' DATE_FORMAT(`datetime_end`,   "%a %b %e %Y") AS `datetime_end_text`,' +
            ' UNIX_TIMESTAMP(`datetime_start`) AS `datetime_start`,' +
            ' UNIX_TIMESTAMP(`datetime_end`) AS `datetime_end`,' +
            ' COUNT(`requests`.`pool`) AS `requestscount`' +
            ' FROM `pools` LEFT JOIN `requests` USING (`pool`)' +
            ' WHERE 1 = ? GROUP BY `pools`.`pool`',
        [token], function(err, pools) {
            if (err) throw err;
            if ( !pools[0] ) {
                fn({results:[]})
            }
            else if ( pools[0] ) {
                pools = pools.map(function (pool) {
                    return {
                        '.poolname': {
                            _text: pool.poolname, 'href': '/pools/' + pool.pool
                        },
                        '.datetime_start_text': pool.datetime_start_text,
                        '.datetime_end_text': pool.datetime_end_text,
                        '.datetime_start': pool.datetime_start_text,
                        '.datetime_end': pool.datetime_end_text,
                        '.requestscount': pool.requestscount
                    }
                })
                fn({results:pools})
            }
    })
}

exports.pool = function (paramsobj, fn) {
    var token = paramsobj.token, pool = paramsobj.pool
    connection.query(
            'SELECT `poolname`,' + 
            ' DATE_FORMAT(`datetime_start`,"%b %d %Y %h:%i %p") AS `datetime_start_text`,' +
            ' DATE_FORMAT(`datetime_end`,"%b %d %Y %h:%i %p") AS `datetime_end_text`,' +
            ' UNIX_TIMESTAMP(`datetime_start`) AS `datetime_start`,' +
            ' UNIX_TIMESTAMP(`datetime_end`) AS `datetime_end`' +
            ' FROM `pools` WHERE 1 = ? AND HEX(`pool`) = ?',
            [token, pool], function(err, poolinfo) {
        if (err) throw err;
        if ( !poolinfo[0] ) {
            fn({results:[]})
        }
        else if ( poolinfo[0] ) {
            fn({results:poolinfo}) }
    })
}

exports.requests = function (paramsobj, fn) {
    var token = paramsobj.token, pool = paramsobj.pool
    connection.query(
            'SELECT `name`, `email`, `provisional`, `datetime`' +
            ' FROM `requests` WHERE 1 = ? AND HEX(`pool`) = ? ORDER BY `datetime`',
            [token, pool], function(err, requests) {
        if (err) throw err;
        if ( !requests[0] ) {
            fn({results:[]})
        }
        else if ( requests[0] ) {
            requests = requests.map(function (request) {
                var req = {
                    '.name': request.name,
                    '.email': request.email,
                    '.datetime': request.datetime.toString()
                }
                req['.provisional'] = 1 === request.provisional
                    ? { checked: 'checked'}: ''
                return req
            })
            fn({results:requests})
        }
    })
}

exports.poolinsert = function (paramsobj, fn) {
    var token = paramsobj.token, post = paramsobj.post
    connection.query(
        'INSERT INTO `pools` (`pool`, `poolname`, `datetime_start`, `datetime_end`)' +
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
    var token = paramsobj.token, pool = paramsobj.pool, post = paramsobj.post
    connection.query(
        'UPDATE pools SET `poolname` = ?,' + 
        ' `datetime_start` = ?, `datetime_end` = ?' +
        //' `datetime_start` = FROM_UNIXTIME(?), `datetime_end` = FROM_UNIXTIME(?)' +
        ' WHERE 1 = ? AND HEX(`pool`) = ?',
            [
                post.poolname, dd.dateappendtime(post.datetime_start, '07:00:00'),
                dd.dateappendtime(post.datetime_end, '23:59:59'),
                1, pool
            ], function(err, poolinsert) {
        if (err) throw err;
        fn({results:poolinsert})
    })
}

exports.poolcurr = function (paramsobj, fn) {
    var pool = paramsobj.pool
    connection.query(
        'SELECT `poolname`, DATE_FORMAT(`datetime_start`, "%a %b %e %Y") AS `datetime_start`,' + 
        ' DATE_FORMAT(`datetime_end`, "%a %b %e %Y") AS `datetime_end`' + 
        ' FROM `pools` WHERE HEX(`pool`) = ? AND `datetime_start` <= ? AND `datetime_end` >= ?',
            [pool, dd.nowdate, dd.nowdate], function(err, poolinfo) {
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
    var pool = paramsobj.pool
    connection.query(
        'SELECT `poolname`, DATE_FORMAT(`datetime_start`, "%a %b %e %Y") AS `datetime_start`,' + 
        ' DATE_FORMAT(`datetime_end`, "%a %b %e %Y") AS `datetime_end`' + 
        ' FROM `pools` WHERE HEX(`pool`) = ?',
            [pool], function(err, poolinfo) {
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
        'SELECT HEX(`pool`) AS `pool`, `name`, `email`, `provisional`, `coursenumber`, `coursename`,' + 
        ' `universityname`, `coursetype`, `coursedegree`, `datetime`' +
        ' FROM `requests` WHERE HEX(`pool`) = ? AND `email` = ? AND `datetime` LIKE ?',
            [paramsobj.pool, paramsobj.email, dd.todaydate + ' %'], function(err, request) {
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
        'INSERT INTO `requests` (`pool`, `email`, `name`, `provisional`, `coursenumber`,' +
        ' `coursename`, `universityname`, `coursetype`, `coursedegree`)' +
        ' VALUES (UNHEX(?),?,?,?,?,?,?,?,?)',
            [
                post.pool, post.email, post.name, post.provisional,
                post.coursenumber, post.coursename, post.universityname
                , post.coursetype, post.coursedegree
            ], function(err, requestinsert) {
        fn({results:requestinsert, err:err})
    })
}

