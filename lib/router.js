var Routes = require('routes')
var router = Routes()
var path = require('path')
var fs = require('fs')
var hscript = require('virtual-dom/h')
var hstream = require('hyperstream')
var createElement = require('virtual-dom/create-element')
var str = require('string-to-stream')

var mysql = require('mysql')
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'test'
})
connection.connect();

var dd = new Date()
var todaydate = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' + String('00' + dd.getDate()).slice(-2)
var nowdate = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' + String('00' + dd.getDate()).slice(-2) +
    ' ' + dd.toTimeString().split(' ')[0]

module.exports = router

router.addRoute('/', function (m, res) {
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
            //console.log('no pools found')
            message = 'No pools found.'
            elems = [hscript('div', message)]
        }
        else if ( rows[0] ) {
            //console.log(rows)
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
            //console.log('no requests found')
            message = 'No requests found.'
            elems = [hscript('div', message)]
        }
        else if ( rows[0] ) {
            //console.log(rows)
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
    connection.query('SELECT poolname, datetime_start, datetime_end FROM pools WHERE pool = ? AND datetime_start <= ? AND datetime_end >= ?',
            [m.params.pool, nowdate, nowdate], function(err, rows, fields) {
        if (err) throw err;
        if ( rows[0] ) {
            templates(
                ['layout.html', 'sign_in_form.html'],
                {'#poolname': rows[0].poolname, '#pool': m.params.pool}, res
            )
        }
        else if ( !rows[0] ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'message.html'],
                {'#message': message, '#pool': m.params.pool}, res
            )
        }
    })
})

router.addRoute('/:pool([0-9]{6})/post', function (m, res) {

    var message = 'Starting...'
    connection.query('SELECT * FROM pools WHERE pool = ? AND datetime_start <= ? AND datetime_end >= ?', // check for existing pool
            [m.params.pool, nowdate, nowdate], function(err, rows, fields) {
        if (err) throw err;
        if ( rows[0] ) {
            connection.query('SELECT * FROM requests WHERE pool = ? AND email = ? AND datetime LIKE ?', // check for existing request
                    [m.params.pool, m.params.email, todaydate + ' %'], function(err, rows, fields) {
                if (err) throw err;
                if ( !rows[0] ) {
                    //console.log('no record found')
                    message = 'Okay to make request.'
                    connection.query('INSERT INTO requests (pool, email, name, provisional, coursenumber, coursename, universityname, coursetype, coursedegree) VALUES (?,?,?,?,?,?,?,?,?)',
                            [
                                m.params.pool, m.params.email, m.params.name, m.params.provisional,
                                m.params.coursenumber, m.params.coursename, m.params.universityname
                                , m.params.coursetype, m.params.coursedegree
                            ], function(err, rows, fields) {
                        if (err) throw err;
                        //console.log('request inserted')
                        message = 'Request accepted.'
                        templates(
                            ['layout.html', 'message.html'],
                            {'#message': message, '#pool': m.params.pool, '#email': m.params.email}, res
                        )
                    })
                }
                else if ( rows[0] ) {
                    //console.log('record found')
                    message = 'Request NOT accepted. Only one request per day allowed.'
                    templates(
                        ['layout.html', 'message.html'],
                        {'#message': message, '#pool': m.params.pool, '#email': m.params.email}, res
                    )
                }
            })
        }
        else if ( !rows[0] ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'message.html'],
                {'#message': message, '#pool': m.params.pool, '#email': m.params.email}, res
            )
        }
    })
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
        pgvars[key] = pgvars[key]
            ? ('string' === typeof pgvars[key]? pgvars[key]: createElement(pgvars[key]).toString())
            : '~'
    })
    return pgvars
}

function vdorfile (template) {
    return 'string' === typeof template? read(template): str(createElement(template).toString())
}

function read (file) {
    return fs.createReadStream(path.join(__dirname, '../public', file))
}

