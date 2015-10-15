var Routes = require('routes')
var router = Routes()
var fs = require('fs')
var path = require('path')
//var hyperstream = require('hyperstream')
var vh = require('virtual-html')
//var createElement = require('virtual-dom/create-element')
module.exports = router

var h = require('virtual-dom/h')

router.addRoute('/', function (m) {
  //return createElement(h('h1', 'tuition pool')).toString()
  return h('h1', 'tuition pool')
})

router.addRoute('/section/:pg', function (m) {
    var html = fs.readFileSync(path.join(__dirname, '../public/section.html'), 'utf-8');
    var dom = vh(html)
    dom = populate(dom, 'section', m.params.pg)
    dom = populate(dom, 'other', 'other stuff')
    return dom
//  return read('section.html').pipe(hyperstream({
//    '#section': m.params.pg
//  }))
})

function read (file) {
  return fs.createReadStream(path.join(__dirname, '../public', file))
}

function populate (dom, sel, val) {
  for ( i = 0, len = dom.children.length; i < len; i++ ) {
    if ( dom.children[i].tagName && dom.children[i].properties.id && sel === dom.children[i].properties.id ) {
      dom.children[i].children[0].text = val
      return dom
    }
  }
  return dom
}
