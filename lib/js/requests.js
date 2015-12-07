var xtend = require('xtend')
var listMethods = require('./list.js')

var checkscommon = {}
var checks = {
    'provisional': {formid:'actionform', handler:'toggle', condition:['email', 'datetime']}
}

var actionscommon = { type: 'request', condition: ['email', 'datetime'], formid: 'actionform' }
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

listMethods.checks({checks:checks, checkscommon:checkscommon})
listMethods.actions({actions:actions, actionscommon:actionscommon})

