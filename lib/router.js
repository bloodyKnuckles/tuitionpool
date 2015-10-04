var Routes = require('routes')
var router = Routes()
module.exports = router

var h = require('virtual-dom/h')

router.addRoute('/', function (m) {
  return h('h1', 'wow')
})
