var Routes = require('routes')
var router = Routes()
var hscript = require('virtual-dom/h')
module.exports = router


router.addRoute('/', function (m) {
    return {
        'templates': ['layout.html', 'home.html', hscript('span', 'Welcome!')],
        'pgvars': { '#header': 'Tuition Pool' }
    }
})

router.addRoute('/:pool([0-9]{6})', function (m) {
    return {
        'templates': [hscript('div', m.params.pool)],
    }
})

router.addRoute('/section1/page1', function (m) {
    return {
        'templates': ['site.html', 'section1.html', 'page1.html'],
        'pgvars': {
            '#sitenav': 'site nav',
            '#sheader': hscript('span', 'Page 1'),
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

