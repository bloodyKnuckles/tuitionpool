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

exports.checks = function (checksobj) {
    Object.keys(checksobj.checks).forEach(function (checktype) {
        var checks = document.querySelectorAll('input.' + checktype) || {}
        Object.keys(checks).forEach(function (idx) {
            checks[idx].addEventListener('click',
                handleAction(xtend(checksobj.checks[checktype], {type:checktype}))

            )
        })
    })
}

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

// keyid?, type?, formid, handler, condition [name1,name2...]
function handleAction (actioninfo) {
    return function (evt) {
        evt.stopPropagation()
        var itemrow = evt.target.parentNodeSelector('tr.showme')
            form    = document.getElementById(actioninfo.formid)

        var re = '', replacement = ''
        if ( actioninfo.keyid ) {
            re = '/[^/]+'
            replacement = '/' + itemrow.querySelector('.' + actioninfo.keyid).textContent
        }
        if ( actioninfo.type )  {
            re += '/[^/]+'
            replacement += '/' + actioninfo.type 
        }
        form.action = form.action.replace( // /\/[^\/]+\/[^\/]+$/,
            new RegExp(re + '/[^/]+$', 'i'),
            replacement + '/' + actioninfo.handler
        )
        actioninfo.condition.forEach(function (value) {
            form[value].value = itemrow.querySelector('.' + value).textContent
        })
        form.submit()
    }
}

