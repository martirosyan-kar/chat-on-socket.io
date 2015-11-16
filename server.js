var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
var redisClient = redis.createClient();
var fs = require('fs');

var messages = [];
var storeMessage = function(name, data){
    var message = JSON.stringify({name:name,data:data});
    redisClient.lpush('messages',message,function(error,response){
        redisClient.ltrim("messages",0,9);
    });
};
io.on('connection',function(socket){
    console.log('client connected');

    socket.on('join',function(name){
        socket.username = name;
        socket.broadcast.emit("messages",name + ' joined the chat');

        redisClient.lrange("messages",0,-1,function(error,messages){
            messages = messages.reverse();
        });
        messages.forEach(function(message){
            message = JSON.parse(message);
            socket.emit('messages',message.name + ': ' + message.data);
        });
    });

    socket.on('messages', function(message){
        var name = socket.username;
        console.log(name);
        data = {name:name, message:message};
        socket.broadcast.emit("messages",data);
        socket.emit("messages", data);
        storeMessage(name,message);
    });

    socket.on('disconnect', function(){
        console.log('client disconnected');
    });
});

app.get('/',function(request,response){
    response.sendFile(__dirname + '/index.html');
});
app.get('/style.css',function(request,response){
    fs.readFile(__dirname + '/style.css', function (err, data) {
        //console.log(data);
        if (err) console.log(err);
        response.writeHead(200, {'Content-Type': 'text/css'});
        response.write(data);
        response.end();
    });
});

server.listen(3000);