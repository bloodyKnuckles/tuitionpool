var Routes = require('routes')
var router = Routes()
var hscript = require('virtual-dom/h')
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

var dd = new Date()
var today_date = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' + String('00' + dd.getDate()).slice(-2)

module.exports = router

router.addRoute('/', function (m) {
    return {
        'templates': ['layout.html', 'home.html', hscript('span', 'Welcome!')],
        'pgvars': { '#header': 'Tuition Pool' }
    }
})

router.addRoute('/:pool([0-9]{6})', function (m) {
    db.each("SELECT * FROM requests WHERE pool = ?", [m.params.pool], function (err, row) {
        console.log(row)
    })
    return {
        'templates': [
            hscript('div', [
                hscript('form', {method: 'post', action: '/' + m.params.pool + '/post'}, [
                    hscript('input', {name: 'email'})
                ]), 
                hscript('span', m.params.pool)
            ])
        ]
    }
})

router.addRoute('/:pool([0-9]{6})/post', function (m) {
    return {
        'templates': [hscript('div', m.params.pool + ': ' + m.params.email)]
    }
})

router.addRoute('/section1/page1', function (m) {
    return {
        'templates': ['site.html', 'section1.html', 'page1.html'],
        'pgvars': {
            '#sitenav': 'site nav',
            '#sheader': hscript('span', hscript('span', 'Page 1')),
            '#one': 'one', '#two': '2', '#three': 'III'
        } 
    }
})

router.addRoute('/section1/tab1/page1', function (m) {
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

router.addRoute('/page1', function (m) {
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
