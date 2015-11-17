var poolform = document.forms.pool
var pool = document.getElementById('pool')
poolform.action = '/pools/' + (('' !== pool.innerText)? pool.innerText + '/post': 'post')
poolform.botblock.value = 'imbotblocked'
//poolform.addEventListener('submit', function(evt){
//    return true
//})

