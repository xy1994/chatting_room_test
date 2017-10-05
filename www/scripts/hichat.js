/*
 *hichat v0.4.2
 *Wayou Mar 28,2014
 *MIT license
 *view on GitHub:https://github.com/wayou/HiChat
 *see it in action:http://hichat.herokuapp.com/
 */
 var last = Date.now();
 var anony = 0;
 var prev_src = "../content/avatar/57.jpg";
var app = angular.module('myapp', []);
var lastsystem = Date.now();
window.onload = function() {
    var hichat = new HiChat();
    hichat.init();
};
var HiChat = function() {
    this.socket = null;
};
HiChat.prototype = {
    init: function() {
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect', function() {
            document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });
        this.socket.on('nickExisted', function() {
            document.getElementById('info').textContent = '!nickname is taken, choose another pls';
        });
        this.socket.on('loginSuccess', function() {
            document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });
        this.socket.on('error', function(err) {
            if (document.getElementById('loginWrapper').style.display == 'none') {
                document.getElementById('status').textContent = '!fail to connect :(';
            } else {
                document.getElementById('info').textContent = '!fail to connect :(';
            }
        });
        this.socket.on('system', function(nickName, userCount, type) {
            var msg = nickName + (type == 'login' ? ' joined' : ' left');
            that._displayNewMsg('system', msg, 'white');
            document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';
        });
        this.socket.on('newMsg', function(user, msg,color, mysrc) {
            that._displayNewMsg(user, msg,color, mysrc);
        });
        this.socket.on('newImg', function(user, img,color, mysrc) {
            that._displayImage(user, img, color,mysrc);
        });
        this.socket.on('newshake',function(user, msg){
            that._shake("historyMsg",user);
            var msg = user + ' shake the chatting window!';
            that._displayNewMsg('system', msg, 'white');
        });
        this.socket.on('newwhisper',function(users){

        });
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            if (nickName.trim().length != 0) {
                that.socket.emit('login', nickName);
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if (nickName.trim().length != 0) {
                    that.socket.emit('login', nickName);
                };
            };
        }, false);
        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                /*color = document.getElementById('colorStyle').value;*/
                mysrc = document.getElementById('myavatar').src;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                if(anony == 0){
                    that.socket.emit('postMsg', msg, "black",mysrc);
                }
                else{
                    that.socket.emit('anonyMsg',msg,"black",mysrc);
                }
                that._displayNewMsg('me', msg, "black",mysrc);
                return;
            };
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                /*color = document.getElementById('colorStyle').value;*/
                mysrc = document.getElementById('myavatar').src;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                if(anony == 0){
                    that.socket.emit('postMsg', msg, "black",mysrc);
                }
                else{
                    that.socket.emit('anonyMsg',msg,"black",mysrc);
                }
                that._displayNewMsg('me', msg, "black",mysrc);
            };
        }, false);
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);
        document.getElementById('shakeBtn').addEventListener('click',function(){
                if(anony == 0){ 
                    that.socket.emit('shake');
                }
                else{
                    that.socket.emit('anonyshake');
                }
                that._shake("historyMsg","me");
        },false);
        document.getElementById('anonymous').addEventListener('click',function(){
                if(anony == 0){
                    anony = 1;
                    prevsrc = document.getElementById('myavatar').src;
                    document.getElementById('myavatar').src = "../content/avatar/anonymous.png";
                    document.getElementById("avatar").disabled = true;
                }
                else{
                    anony = 0;
                    document.getElementById('myavatar').src = prevsrc;
                    document.getElementById("avatar").disabled = false;
                }
        },false);
        /*document.getElementById('whisper').addEventListener('click',function(){
            that.socket.emit('whisperchat', user);
        });*/
        document.getElementById('sendImage').addEventListener('change', function() {
            mysrc = document.getElementById('myavatar').src;
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader();
                    /*color = document.getElementById('colorStyle').value;*/
                if (!reader) {
                    that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'white');
                    this.value = '';
                    return;
                };
                reader.readAsDataURL(file);
                reader.onload = function(e) {
                    //this.value = '';
                    if(anony == 0){
                        that.socket.emit('img', e.target.result, "black",mysrc);
                    }
                    else{
                        that.socket.emit('anonyimg',e.target.result,"black",mysrc);
                    }
                    that._displayImage('me', e.target.result, "black",mysrc);
                };
                this.value = '';
                //reader.readAsDataURL(file);
            };
        }, false);
        this._initialEmoji();
        this._initialAvatar();
        document.getElementById('emoji').addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if(emojiwrapper.style.display == 'block'){
                emojiwrapper.style.display = 'none';
            }
            else{
                emojiwrapper.style.display = 'block';
            }
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        document.getElementById('avatar').addEventListener('click', function(e) {
            var avatarwrapper = document.getElementById('avatarWrapper');
            if(avatarwrapper.style.display == 'block'){
                avatarwrapper.style.display = 'none';
            }
            else{
                avatarwrapper.style.display = 'block';
            }
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var avatarwrapper = document.getElementById('avatarWrapper');
            if (e.target != avatarwrapper) {
                avatarwrapper.style.display = 'none';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            };
        }, false);
        document.getElementById('avatarWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                document.getElementById("myavatar").src = "../content/avatar/" + target.title + '.jpg';
                /*document.getElementById('myname').innerHTML = 'abc';
                document.getElementById('myname').style.display = 'inline';*/
            };
        }, false);
    },
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _initialAvatar: function(){
        
        var avatarContainer = document.getElementById('avatarWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 90; i > 0; i--) {
            var avatarItem = document.createElement('img');
            avatarItem.src = '../content/avatar/' + i + '.jpg';
            avatarItem.title = i;
            docFragment.appendChild(avatarItem);
        };
        avatarContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, msg, color,mysrc) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
        if(user != "me" && user != "system"){
            msgToDisplay.style.color = color || '#000';
            msgToDisplay.innerHTML = /*"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"*/ + user + "</br>" + '<div class="bubble left">'+'<a class="avatar"><img src="'+mysrc+ '" alt/></a>'+ '<div class="wrap">'+'<div class="content" style="max-width: 80%;">' + msg + '</div>'+'</div>'+'</div>';
        }
        if(user == "me"){
            /*msgToDisplay.innerHTML = msg + '<span class="timespan">(' + date + '): </span>' + '<img src="'+mysrc+'"width="30" height="30" style="border-radius:50%;"; />';
            msgToDisplay.setAttribute('style','text-align: right;');*/
            msgToDisplay.style.color = color || '#000';
            msgToDisplay.innerHTML = '<div class="bubble right">'+'<a class="avatar"><img src="'+mysrc+ '" alt/></a>'+'<div class="wrap">'+'<div class="content" style="max-width: 80%;">' + msg + '</div>'+'</div>'+'</div>';
        }
        if(user == "system"){
            msgToDisplay.setAttribute('style','width:200px;margin: 20px auto;background-color:grey;text-align: center;');
            msgToDisplay.style.color = color || '#000';
            msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
        }
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color,mysrc) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        if(user!="me"){
            msgToDisplay.style.color = color || '#000';
            msgToDisplay.innerHTML =/*"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +*/ user  +"</br>" + '<img class="avatar" src="'+mysrc+'"width="35" height="35" style="border-radius:50%;vertical-align: top;" />' + "&nbsp;&nbsp;&nbsp;" +  '<img src="' + imgData + '" style="max-width: 50%;"/></a><br/>';
            msgToDisplay.setAttribute('style','text-align: left;opacity:1.0; -moz-opacity:1.0; filter:alpha(opacity=100)');
            msgToDisplay.setAttribute("stroke-opacity", "1");
        }
        if(user == "me"){
            msgToDisplay.innerHTML = '<img src="' + imgData + '" style="max-width: 50%;"/></a>'  +"&nbsp;&nbsp;&nbsp;"+ '<img class="avatar" src="'+mysrc+'"width="35" height="35" style="border-radius:50%; vertical-align: top;"/>';
            msgToDisplay.setAttribute('style','text-align: right;opacity:1.0; -moz-opacity:1.0; filter:alpha(opacity=100)');
            msgToDisplay.setAttribute("stroke-opacity", "1");
        }
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            /*if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } */
            if (emojiIndex <= totalEmojiNum) {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    },
    _shake:function (e, user,oncomplete,distance, time) {

        /*var msg = nickName + 'send a shake!';
        that._displayNewMsg('system', msg, 'red');*/
    // Handle arguments
    if (typeof e === "string") e = document.getElementById(e);
    if (!time) time = 300;
    if (!distance) distance = 10;
    var curr = Date.now();
        if((curr - last)>1000){
    // Save the original style of e, Make e relatively positioned, Note the animation start time, Start the animation
    var originalStyle = e.style.cssText;
    e.style.position = "relative";
    var start = (new Date()).getTime();
    animate();
    // This function checks the elapsed time and updates the position of e.
    // If the animation is complete, it restores e to its original state.
    // Otherwise, it updates e's position and schedules itself to run again.
    function animate() {
        var now = (new Date()).getTime();
        // Get current time
        var elapsed = now-start;
        // How long since we started
        var fraction = elapsed/time;
        // What fraction of total time?
        if (fraction < 1) {
            // If the animation is not yet complete
            // Compute the x position of e as a function of animation
            // completion fraction. We use a sinusoidal function, and multiply
            // the completion fraction by 4pi, so that it shakes back and
            // forth twice.
            var x = distance * Math.sin(fraction*4*Math.PI);
            e.style.left = x + "px";
            // Try to run again in 25ms or at the end of the total time.
            // We're aiming for a smooth 40 frames/second animation.
            setTimeout(animate, Math.min(25, time-elapsed));
        }
        else {
            // Otherwise, the animation is complete
            e.style.cssText = originalStyle // Restore the original style
            if (oncomplete) oncomplete(e);
            // Invoke completion callback
        }
    }
    last = curr;
    if(user == "me"){
        this._displayNewMsg('system', 'You shaked the chatting window!', 'white');
    }
}
else{
    this._displayNewMsg('system', 'You shaked too fast!', 'white');
}
}

};
