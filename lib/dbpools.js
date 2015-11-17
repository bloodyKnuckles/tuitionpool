var mysql = require('mysql')
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'tuitionpool'
})
connection.connect()

var dd = new Date()
var todaydate = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' +
    String('00' + dd.getDate()).slice(-2)
var nowdate = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' +
    String('00' + dd.getDate()).slice(-2) +
    ' ' + dd.toTimeString().split(' ')[0]

exports.conn = connection

exports.pools = function (token, fn) {
    connection.query(
            'SELECT HEX(pools.pool) , poolname,' +
            ' DATE_FORMAT(datetime_start, "%a %b %e %Y") AS datetime_start,' +
            ' DATE_FORMAT(datetime_end,   "%a %b %e %Y") AS datetime_end,' +
            ' COUNT(requests.pool) AS requestscount' +
            ' FROM pools LEFT JOIN requests USING (pool)' +
            ' WHERE 1 = ? GROUP BY pools.pool',
        [token], function(err, pools) {
            if (err) throw err;
            if ( !pools[0] ) {
                fn([])
            }
            else if ( pools[0] ) {
                pools = pools.map(function (pool) {
                    return {
                        '.poolname': {
                            _text: pool.poolname, 'href': '/pools/' + pool.pool
                        },
                        '.datetime_start': pool.datetime_start,
                        '.datetime_end': pool.datetime_end,
                        '.requestscount': pool.requestscount
                    }
                })
                fn(pools)
            }
    })
}

exports.pool = function (token, pool, fn) {
    connection.query(
            'SELECT poolname,' + 
            ' DATE_FORMAT(datetime_start,"%b %d %Y %h:%i %p") AS datetime_start,' +
            ' DATE_FORMAT(datetime_end,"%b %d %Y %h:%i %p") AS datetime_end' +
            ' FROM pools WHERE 1 = ? AND HEX(pool) = ?',
            [token, pool], function(err, poolinfo) {
        if (err) throw err;
        if ( !poolinfo[0] ) {
            fn([])
        }
        else if ( poolinfo[0] ) {
            fn(poolinfo) }
    })
}

exports.requests = function (token, pool, fn) {
    connection.query(
            'SELECT name, email, provisional,' +
            ' datetime' +
//            '(CASE provisional ' + 
//            'WHEN 1 THEN DATE_FORMAT(DATE_SUB(datetime, INTERVAL 1 DAY),"%b %d %Y %h:%i %p") ' + 
//            'ELSE DATE_FORMAT(datetime,"%b %d %Y %h:%i %p") END) AS datetime ' +
            ' FROM requests WHERE 1 = ? AND HEX(pool) = ? ORDER BY datetime',
            [token, pool], function(err, requests) {
        if (err) throw err;
        if ( !requests[0] ) {
            fn([])
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
            fn(requests)
        }
    })
}

exports.poolanon = function (pool, fn) {
    connection.query(
        'SELECT poolname, DATE_FORMAT(datetime_start, "%a %b %e %Y") AS datetime_start,' + 
        ' DATE_FORMAT(datetime_end, "%a %b %e %Y") AS datetime_end' + 
        ' FROM pools WHERE HEX(pool) = ? AND datetime_start <= ? AND datetime_end >= ?',
            [pool, nowdate, nowdate], function(err, poolinfo) {
        if (err) throw err;
        if ( !poolinfo[0] ) {
            fn([])
        }
        else if ( poolinfo[0] ) {
            fn(poolinfo)
        }
    })
}

exports.request = function (pool, email, fn) {
    connection.query(
        'SELECT HEX(pool), name, email, provisional, coursenumber, coursename,' + 
        ' universityname, coursetype, coursedegree, datetime' 
        ' FROM requests WHERE HEX(pool) = ? AND email = ? AND datetime LIKE ?',
            [pool, email, todaydate + ' %'], function(err, request) {
        if (err) throw err;
        if ( !request[0] ) {
            fn([])
        }
        else if ( request[0] ) {
            fn(request)
        }
    })
}

exports.requestinsert = function (post, fn) {
    connection.query(
        'INSERT INTO requests (pool, email, name, provisional, coursenumber,' +
        ' coursename, universityname, coursetype, coursedegree)' +
        ' VALUES (UNHEX(?),?,?,?,?,?,?,?,?)',
            [
                post.pool, post.email, post.name, post.provisional,
                post.coursenumber, post.coursename, post.universityname
                , post.coursetype, post.coursedegree
            ], function(err, requestinsert) {
        if (err) throw err;
        fn(requestinsert)
    })
}

exports.poolinsert = function (post, fn) {
    connection.query(
        'INSERT INTO pools (pool, poolname, datetime_start, datetime_end)' +
        ' VALUES (ordered_uuid(uuid()),?,?,?)',
            [
                post.poolname, post.datetime_start, post.datetime_end
            ], function(err, poolinsert) {
        if (err) throw err;
        fn(poolinsert)
    })
}

