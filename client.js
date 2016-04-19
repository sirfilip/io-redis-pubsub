var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var connectedClients = [];
var redis = require('redis');
var subscriptions = {};
var publisher = redis.createClient();
var subscriber = redis.createClient();
var MSG_CHANNEL = 'message-roster';

if (process.argv.length != 3) {
    console.log("Usage: node client.js PORT_NUM");
    process.exit(1);
}
port = parseInt(process.argv[2]);

subscriber.on('message', function(channel, message) {
    if (channel !== MSG_CHANNEL) return; // we are only interested for messages.
    var msg = JSON.parse(message);
    console.log(msg);
    var sender = connectedClients.find(function(client) {
        return client.id === msg.origin;
    });
    if (sender) {
        sender.broadcast.emit('message', msg);
    } else {
        io.sockets.emit('message', msg);
    }
});
subscriber.subscribe(MSG_CHANNEL);

io.on('connection', function(socket) {
    connectedClients.push(socket);

    socket.on('subscribe to channel', function(channel) {
        subscriptions[channel.name] = subscriptions[channel.name] || [];
        if (subscriptions[channel.name].indexOf(socket.id) === -1) {
            subscriptions[channel.name].push(socket.id) 
        }
        // emit last ten messages on subscribing to socket
    });

    socket.on('chat message', function(message) {
        // channel, author, text, timestamp
        var msg = {};
        msg.message = message;
        msg.origin = socket.id;
        msg.created_at = new Date();
        publisher.publish(MSG_CHANNEL, JSON.stringify(msg));
    });

    socket.on('disconnect', function() {
        var index = connectedClients.findIndex(function(client) {
            return socket.id === client.id;
        });
        connectedClients.splice(index, 1);
    });
});

app.use(express.static(__dirname + '/public'));


server.listen(port, function() {
    console.log('Server started on port: ' + port);
});
