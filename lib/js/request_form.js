var requestform = document.forms.request
requestform.action = document.getElementById('pool').innerText + '/post'
requestform.botblock.value = 'imbotblocked'
requestform.addEventListener('submit', function(evt){
    var pass = true, elems = ['name', 'email', 'coursenumber', 'coursename', 'universityname'],
      radiobuttons = ['provisional', 'coursetype', 'coursedegree']
    elems.forEach(function (item) {
        if ( "" === evt.target[item].value ) {
            evt.target[item].style.border="1px solid red"
            pass = false
        }
        else {
            evt.target[item].style.border=""
        }
    })
    radiobuttons.forEach(function (rb) {
        if ( !Object.keys(evt.target[rb]).filter(function (item) {
            return evt.target[rb][item].checked? true: false
        }).length ) {
            evt.target[rb][0].parentNode.style.color="red"
            pass = false
        }
        else {
            evt.target[rb][0].parentNode.style.color=""
        }
    })
    if ( !pass ) {
        alert('Please complete all fields.')
        evt.preventDefault()
    }
})
