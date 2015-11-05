var Routes = require('routes')
var router = Routes()
var path = require('path')
var fs = require('fs')
var hscript = require('virtual-dom/h')
var hstream = require('hyperstream')
var createElement = require('virtual-dom/create-element')
var str = require('string-to-stream')
var db = require('../lib/db.js').db
//db.each("SELECT name FROM sqlite_master WHERE type = 'table'", function (err, row) {
//db.each("SELECT name FROM sqlite_master WHERE type = ?", ['table'], function (err, row) {
//    console.log('row: ', row)
//})
//db.run('INSERT INTO requests (pool, email) VALUES ("123451", "test@test.com")')
//db.run('DELETE FROM requests WHERE pool = "123451"')
//db.run('SELECT * FROM requests WHERE pool = ?', ['123451'], function (err, row) {
//    console.log('row: ', row)
//})

var mysql = require('mysql')
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
})
connection.connect();
connection.query('SELECT * FROM test', function(err, rows, fields) {
    if (err) throw err;
    console.log('The solution is: ', rows[0].text);
})

var dd = new Date()
var todaydate = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' + String('00' + dd.getDate()).slice(-2)

module.exports = router

router.addRoute('/', function (m, res) {
    //return {
    //    'templates': ['layout.html', 'home.html', hscript('span', 'Welcome!')],
    //    'pgvars': { '#header': 'Tuition Pool' }
    //}
    templates(
        ['layout.html', 'home.html', hscript('span', 'Welcome!')],
        { '#header': 'Tuition Pool' }, res
    )
})

router.addRoute('/pools', function (m, res) {
    var message = 'Starting...'
    var elems = [hscript('div', message)]
    connection.query('SELECT DISTINCT pool FROM requests WHERE 1 = ?',
            [1], function(err, rows, fields) {
        if (err) throw err;
        if ( !rows[0] ) {
            console.log('no pools found')
            message = 'No pools found.'
            elems = [hscript('div', message)]
        }
        else if ( rows[0] ) {
            console.log(rows)
            message = 'Pools found: '
            elems = [hscript('h3', message)]
            rows.forEach(function (item) {
                elems.push(hscript('div', hscript('a', {href: '/pools/' + item.pool}, item.pool)))
            })
        }
        templates(
            ['layout.html', hscript('div', {class: 'centerbox'}, elems)],
            {}, res
        )
    })
})

router.addRoute('/pools/:pool([0-9]{6})', function (m, res) {
    var message = 'Starting...'
    var elems = [hscript('div', message)]
    connection.query('SELECT email, DATE_FORMAT(datetime,"%b %d %Y %h:%i %p") AS datetime FROM requests WHERE pool = ? ORDER BY datetime',
            [m.params.pool], function(err, rows, fields) {
        if (err) throw err;
        if ( !rows[0] ) {
            console.log('no requests found')
            message = 'No requests found.'
            elems = [hscript('div', message)]
        }
        else if ( rows[0] ) {
            console.log(rows)
            message = 'Requests found for Pool ' + m.params.pool + ': '
            elems = [hscript('h3', message), hscript('br')]
            rows.forEach(function (item) {
                elems.push(hscript('div', item.email + ' ' + item.datetime))
            })
        }
        templates(
            ['layout.html', hscript('div', {class: 'centerbox'}, elems)],
            {}, res
        )
    })
})

router.addRoute('/:pool([0-9]{6})', function (m, res) {
    templates(
        ['layout.html', hscript('div', {class: 'centerbox'}, [
            hscript('h3', 'Pool: ' + m.params.pool),
            hscript('form', {method: 'post', action: '/' + m.params.pool + '/post'},
                [hscript('div', 'Enter your email:'), hscript('input', {name: 'email'})]
            )
            ])
        ], {}, res
    )

    //db.each("SELECT * FROM requests WHERE pool = ?", [m.params.pool], function (err, row) {
    //    console.log(row)
    //})
    //return {
    //    'templates': [
    //        hscript('div', [
    //            hscript('form', {method: 'post', action: '/' + m.params.pool + '/post'}, [
    //                hscript('input', {name: 'email'})
    //            ]), 
    //            hscript('span', m.params.pool)
    //        ])
    //    ]
    //}
})

router.addRoute('/:pool([0-9]{6})/post', function (m, res) {

    var message = 'Starting...'
    connection.query('SELECT * FROM requests WHERE pool = ? AND email = ? AND datetime LIKE ?',
            [m.params.pool, m.params.email, todaydate + ' %'], function(err, rows, fields) {
        if (err) throw err;
        if ( !rows[0] ) {
            console.log('no record found')
            message = 'Okay to make request.'
            connection.query('INSERT INTO requests (pool, email) VALUES (? , ?)',
                    [m.params.pool, m.params.email], function(err, rows, fields) {
                if (err) throw err;
                console.log('request inserted')
                message = 'Request accepted.'
                templates(
                    ['layout.html', hscript('div', {class: 'centerbox'},
                        [
                            hscript('h3', message),
                            hscript('div', 'Pool: '  + m.params.pool),
                            hscript('div', 'Email: ' + m.params.email)
                        ]
                    )],
                    {}, res
                )
            })
        }
        else if ( rows[0] ) {
            console.log('record found')
            message = 'Request NOT accepted. Only one request per day allowed.'
            templates(
                ['layout.html', hscript('div', {class: 'centerbox'},
                    [
                        hscript('h3', message),
                        hscript('div', 'Pool: '  + m.params.pool),
                        hscript('div', 'Email: ' + m.params.email)
                    ]
                )],
                {}, res
            )
        }
    })

    //res.writeHead(200, {"Content-Type": "text/plain"})
    //res.end('there it is')
    //return {
    //    'templates': [hscript('div', m.params.pool + ': ' + m.params.email)]
    //}
})

router.addRoute('/section1/page1', function (m, res) {
    return {
        'templates': ['site.html', 'section1.html', 'page1.html'],
        'pgvars': {
            '#sitenav': 'site nav',
            '#sheader': hscript('span', hscript('span', 'Page 1')),
            '#one': 'one', '#two': '2', '#three': 'III'
        } 
    }
})

router.addRoute('/section1/tab1/page1', function (m, res) {
    return {
        'templates': ['site.html', 'section1.html', 'tab1.html', 'page1.html'],
        'pgvars': {
            '#sitenav': 'site nav',
            '#sheader': 'Section 1',
            '#theader': hscript('span', 'Tab 1'),
            '#one': 'one', '#two': '2', '#three': 'section nav', '#four': 'tab nav'
        } 
    }
})

router.addRoute('/page1', function (m, res) {
    return {
        'templates': ['page1.html'],
        'pgvars': {
            '#one': 'one', '#two': '2'
        } 
    }
})

//router.addRoute('/:section/:pg', function (m) {
//    return {
//        'templates': [m.params.section + '.html'],
//        'pgvars': { '#sheader': hscript('span', m.params.pg), '#one': 'one', '#two': '2' } 
//    }
//})

function templates (templates, pgvars, res) {
    ltemplates(templates)
    .pipe(hstream(procpgvars(pgvars)))
    .pipe(res)
}

function ltemplates (templates) {
    var start = templates.reverse().shift()
    return templates.reduce(function(prev, next) {
        return vdorfile(next).pipe(hstream({'.template': prev}))
    }, vdorfile(start))
}

function procpgvars (pgvars) {
    pgvars = pgvars || {}
    Object.keys(pgvars).forEach(function (key) {
        pgvars[key] = 'string' === typeof pgvars[key]? pgvars[key]: createElement(pgvars[key]).toString()
    })
    return pgvars
}

function vdorfile (template) {
    return 'string' === typeof template? read(template): str(createElement(template).toString())
}

function read (file) {
    return fs.createReadStream(path.join(__dirname, '../public', file))
}

