$('#change_password').on('submit', (e) => {
  let new_pwd = $('#new_pwd').val();
  let chk_pwd = $('#chk_pwd').val();

  if (new_pwd !== chk_pwd) {
    alert("Passwords Don't Match!");
    return false;
  }

  let params = new URLSearchParams(document.location.search.substring(1))
  let request = params.get('request');

  $('#request').remove();
  $('<input />').attr('type', 'hidden')
                .attr('id', 'request')
                .attr('name', 'request')
                .attr('value', request)
                .appendTo('#change_password');
});
