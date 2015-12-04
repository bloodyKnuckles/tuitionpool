var xtend = require('xtend')
Node.prototype.parentNodeSelector = require('parent-node-selector')

var actioncommon = { type: 'request', values: {email:1, datetime:3}, form: 'actiondeleteform' }
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

var actionareas = document.querySelectorAll('td div.actions')
Object.keys(actionareas).forEach(function (idx) {
    var itemclassname = actionareas[idx].parentNodeSelector('td').className
    var itemstatus = (itemclassname.match(/\b(strikeme)\b/) && itemclassname.match(/\b(strikeme)\b/)[1]) ||
        (itemclassname.match(/\b(nostrike)\b/) && itemclassname.match(/\b(nostrike)\b/)[1]) || ''
 
    actionareas[idx].innerHTML = actions[itemstatus].actionhtml
    actions[itemstatus].actionhandlers.forEach(function (handlerobj) {
        var element = actionareas[idx].querySelector(handlerobj.element)
        element.addEventListener('click',
            handleAction(xtend({handler:handlerobj.handler}, actioncommon))
        )
    })
})

var provs = document.querySelectorAll('input.provisional')
Object.keys(provs).forEach(function (idx) {
    provs[idx].addEventListener('click', function (evt) {
        evt.stopPropagation()
        console.log('prov clicked')
    })
})

showExtra(document.querySelectorAll('a.showextra'))
showExtra(document.querySelectorAll('tr.clickme'))

function showExtra (elems) {
    elems = elems || {}
    Object.keys(elems).forEach(function (idx) {
        elems[idx].addEventListener('click', function (evt) {
            evt.stopPropagation()
            var requestinfo = evt.target.parentNodeSelector('tbody.rowinfo').querySelectorAll('tr')
            var showextralink = requestinfo[0].querySelector('a.showextra')
            showextralink.innerHTML = '+' === showextralink.innerHTML? '&ndash;': '+'
            requestinfo[1].classList.toggle('hideme')
        })
    })
}

function handleAction (actioninfo) {
    return function (evt) {
        evt.stopPropagation()
        var itemrow = evt.target.parentNodeSelector('tr.clickme').cells
            form    = document.getElementById(actioninfo.form)

        form.action = form.action.replace(
            new RegExp('/' + actioninfo.type + '/.+$', 'i'),
            '/' + actioninfo.type + '/' + actioninfo.handler
        )
        Object.keys(actioninfo.values).forEach(function (valuekey) {
            form[valuekey].value = itemrow[actioninfo.values[valuekey]].textContent
        })
        form.submit()
    }
}

