var xtend = require('xtend')
Node.prototype.parentNodeSelector = require('parent-node-selector')

exports.actions = function (actionsobj) {
    Object.keys(actionsobj.actions).reverse().forEach(function (itemstatus) {
        var actioncells = document.querySelectorAll('td.actioncell.' + itemstatus)
        Object.keys(actioncells).forEach(function (actioncell) {
            actioncells[actioncell].querySelector('div.actions').innerHTML = actionsobj.actions[itemstatus].actionhtml
            actionsobj.actions[itemstatus].actionhandlers.forEach(function (handlerobj) {
                actioncells[actioncell].querySelector(handlerobj.element).addEventListener('click',
                    handleAction(xtend({handler:handlerobj.handler}, actionsobj.actionscommon))
                )
            })
        })
    })
}

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

