$(document).ready(function () {
  // Form submittion with new message in field with id 'm'
  let socket = io();
  $('form').submit(function () {
    const messageToSend = $('#m').val();
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });

  socket.on('user', data => {
    console.log( data );
    $('#num-users').text(data.currentUsers + ' users online');
    let message = data.name + ( (data.connected)
                            ? ' has joined the chat.'
                            : ' has left the chat.' );
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  socket.on('chat message', data => {
    const msg = data.name + ":" + data.message;
    $('#messages').append($('<li>').html('<b>' + msg + '</b>'));
  });
});
