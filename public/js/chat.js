(function() {

    var socket = io.connect();
    
    var chat = document.querySelector('#chat');
    var message = document.querySelector('#message');
    var send = document.querySelector('#send');

    send.addEventListener('click', function(e) {
        e.preventDefault();
        appendMessage(message.value);
        socket.emit('chat message',  message.value);
    });

    socket.on('message', function(data) {
        appendMessage(data.message);
    });


    function appendMessage(message) {
        var p = document.createElement('p');
        p.innerText = message;
        chat.appendChild(p);
    }


})();
