var listMethods = require('./list.js')

var checks = {}
var actionscommon = { keyid: 'pooltoken', condition: ['pooltoken'], formid: 'actionform' }
var actions = {
    'strikeme': {
        actionhtml: '<a class="undelete" href="#">Undelete</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a class="deleteperm" href="#">Delete Permanently</a>',
        actionhandlers: [{'element':'.undelete', 'handler':'reactivate'}, {'element':'.deleteperm', 'handler':'delete'}]
    },
    'nostrike': {
        actionhtml: '<a class="actiondelete" href="#">Delete</a>',
        actionhandlers: [{ 'element':'.actiondelete', 'handler':'deactivate' }]
    }
}
listMethods.actions({actions:actions,actionscommon:actionscommon})

