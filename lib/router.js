var Routes = require('routes')
var router = Routes()
module.exports = router

var hscript = require('virtual-dom/h')
var createElement = require('virtual-dom/create-element')


router.addRoute('/', function (m) {
    return {
        'sections': ['layout.html', 'home.html'], //, hscript('span', 'Welcome!')],
        'pgvars': { '#header': 'Tuition Pool' }
    }
})

router.addRoute('/section1/page1', function (m) {
    return {
        'sections': ['site.html', 'section1.html', 'page1.html'],
        'pgvars': {
            '#sitenav': 'site nav',
            '#sheader': hs('span', 'Page 1'),
            '#one': 'one', '#two': '2', '#three': 'III'
        } 
    }
})

router.addRoute('/section1/tab1/page1', function (m) {
    return {
        'sections': ['site.html', 'section1.html', 'tab1.html', 'page1.html'],
        'pgvars': {
            '#sitenav': 'site nav',
            '#sheader': 'Section 1',
            '#theader': hs('span', 'Tab 1'),
            '#one': 'one', '#two': '2', '#three': 'section nav', '#four': 'tab nav'
        } 
    }
})

router.addRoute('/page1', function (m) {
    return {
        'sections': ['page1.html'],
        'pgvars': {
            '#one': 'one', '#two': '2'
        } 
    }
})

//router.addRoute('/:section/:pg', function (m) {
//    return {
//        'sections': [m.params.section + '.html'],
//        'pgvars': { '#sheader': hs('span', m.params.pg), '#one': 'one', '#two': '2' } 
//    }
//})

function hs (tag, content) {
    return createElement(hscript(tag, content)).toString()
}
