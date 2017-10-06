var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];
    last = Date.now();
//specify the html we will use
app.use('/', express.static(__dirname + '/www'));
//bind the server to the 80 port
//server.listen(80);//for local test
server.listen(process.env.PORT || 3000);//publish to heroku
server.listen(process.env.OPENSHIFT_NODEJS_PORT || 3000);//publish to openshift
//console.log('server started on port'+process.env.PORT || 3000);
//handle the socket
io.sockets.on('connection', function(socket) {
    //new user login
    socket.on('login', function(nickname) {
        if (users.indexOf(nickname) > -1 || nickname == "anonymous") {
            socket.emit('nickExisted');
        } else {
            //socket.userIndex = users.length;
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login');
        };
    });
    //user leaves
    socket.on('disconnect', function() {
        if (socket.nickname != null) {
            //users.splice(socket.userIndex, 1);
            users.splice(users.indexOf(socket.nickname), 1);
            socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
        }
    });
    //new message get
    socket.on('postMsg', function(msg,color, mysrc) {
        socket.broadcast.emit('newMsg', socket.nickname, msg,color, mysrc);
    });
    socket.on('anonyMsg', function(msg, color,mysrc) {
        socket.broadcast.emit('newMsg', "anonymous", msg, color,mysrc);
    });
    //new image get
    socket.on('img', function(imgData,color, mysrc) {
        socket.broadcast.emit('newImg', socket.nickname, imgData,color, mysrc);
    });
    socket.on('anonyimg', function(imgData, color,mysrc) {
        socket.broadcast.emit('newImg', "anonymous", imgData,color, mysrc);
    });
    //shake the window
    socket.on('shake', function() {
        var now = Date.now();
        if((now - last)>1000){
        socket.broadcast.emit('newshake',socket.nickname);
        last = now;
    }
    });
    socket.on('anonyshake', function() {
        var now = Date.now();
        if((now - last)>1000){
        socket.broadcast.emit('newshake',"anonymous");
        last = now;
    }
    });
    socket.on('whisperchat',function(){
        socket.broadcast.emit('newwhisper',users);
    });
});
