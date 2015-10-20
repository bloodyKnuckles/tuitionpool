var Routes = require('routes')
var router = Routes()
module.exports = router

var h = require('virtual-dom/h')

router.addRoute('/', function (m) {
    return {
        'sections': ['home.html'],
        'content': { 'header': h('span', 'Tuition Pool'), 'pg': h('span', 'Welcome!'),
            'pgvar': { '#one': 'one', '#two': '2', '#three': 'III' } 
        }
    }
})

router.addRoute('/section1/page1', function (m) {
    return {
        'sections': ['section1.html'],
        'content': { 'header': h('span', 'Page 1'), 'pg': 'page1.html',
            'pgvar': { '#one': 'one', '#two': '2', '#three': 'III' } 
        }
    }
})

router.addRoute('/section1/tab1/page1', function (m) {
    return {
        'sections': ['section1.html', 'tab1.html'],
        'content': { 'header': h('span', 'Tab 1'), 'pg': 'page1.html',
            'pgvar': { '#one': 'one', '#two': '2', '#three': 'section nav', '#four': 'tab nav' } 
        }
    }
})

//router.addRoute('/:section/:pg', function (m) {
//    return {
//        'sections': [m.params.section + '.html'],
//        'content': { 'header': h('span', m.params.pg), 'pg': m.params.pg,
//            'pgvar': { '#one': 'one', '#two': '2' } 
//        }
//    }
//})

function read (file) {
    return fs.createReadStream(path.join(__dirname, '../public', file))
}

