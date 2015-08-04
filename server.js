
var express = require('express');
var app = express();
var http_ = require('http');
var http = http_.Server(app);

var io = require('socket.io')(http);
var fs = require('fs');
var nsh = require("node-syntaxhighlighter");
var libxmljs = require("libxmljs");

var nickMap = {};
var idMap = {};
var channelTopics = {};

// run-time temp data
var channelsMap = {};
var peopleInChannel = {};
var socketMap = {};
var onlineNickMap = {};

var nickParts = ["mi", "ka", "yu", "ho", "pe", "ko", "yo", "a", "ta", "ri", "sa", "i"];

var channelHistories = {};
var language = nsh.getLanguage("cpp");
var password = "";

app.use('/styles', express.static(__dirname + '/html/styles'));
app.use('/js', express.static(__dirname + '/html/js'));
app.get('/chat', function(req, res) {
  res.sendFile(__dirname + '/html/index.html');
});

io.on('connection', function(socket) {
  console.log('a user connected');
});

http.listen(3001, function() {
  console.log('listening on *:3001');
});

function startUpLoad() {
var options = {};
options["encoding"] = "utf-8";

if(fs.existsSync(__dirname + "/pw")) {
  try {
    password = fs.readFileSync(__dirname + "/pw", options);
  }
  catch(e) {
    console.log('password was not set.');
  }
}


if(fs.existsSync(__dirname + "/save/nickMap")) {
  try {
    var nickData = fs.readFileSync(__dirname + "/save/nickMap", options);
    nickMap = JSON.parse(nickData);
  }
  catch(e) {
    console.log('oops');
  }
}

if(fs.existsSync(__dirname + "/save/idMap")) {
  try {
  var idData = fs.readFileSync(__dirname + "/save/idMap", options);
    idMap = JSON.parse(idData);
  }
  catch(e) {
    console.log('oops');
  }
}

if(fs.existsSync(__dirname + "/save/channelTopics")) {
  try {
  var topics = fs.readFileSync(__dirname + "/save/channelTopics", options);
    channelTopics = JSON.parse(topics);
  }
  catch(e) {
    console.log('oops');
  }
}


}

function nickChanged(id, nick) {
  idMap[nick] = id;
  nickMap[id] = nick;
  onlineNickMap[nick] = id;
 
  fs.writeFile(__dirname + "/save/nickMap", JSON.stringify(nickMap), function(err) {
    if(err) {
      return console.log(err);
    }
  });

  fs.writeFile(__dirname + "/save/idMap", JSON.stringify(idMap), function(err) {
    if(err) {
      return console.log(err);
    }
  });
}

function gracefulShutdown() {
  for(var channel in channelHistories) {
    console.log(channel);
    fs.writeFileSync(__dirname + '/save/logs/' + channel, JSON.stringify(channelHistories[channel]));
  }
  for(var channelMap in channelsMap) {
    fs.writeFileSync(__dirname + '/save/user/' + channelMap, JSON.stringify(channelsMap[channelMap]));
  }
  fs.writeFileSync(__dirname + '/save/channelTopics', JSON.stringify(channelTopics));
  process.exit();
}

function loadHistory(channel) {
  try {
    var obj = JSON.parse(fs.readFileSync(__dirname + '/save/logs/' + channel));
    channelHistories[channel] = obj;
  }
  catch(err) {
    console.log("failed to load history for: " + channel);
    console.log(err);
    channelHistories[channel] = [];
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);   

startUpLoad();

function sendMessage(socket, channel, msg) {
  var channelMessage = socket.urtela_nick + "|" + msg;
  
  // send to those who are present in the channel.
  for(var userId in peopleInChannel[channel]) {
    if(userId in socketMap) {
      socketMap[userId].emit('chat message', timeNow() + '|' + channel + '|' + channelMessage);
    }
  }
      
  if(!(channel in channelHistories))
    loadHistory(channel);
  channelHistories[channel].push([timeNow(), channelMessage]);
}

function escapePipes(pipes) {
  return pipes.replace(/\|/g, "&#124;");
}

function escapeHtml(unsafe) {
  return escapePipes(unsafe
   .replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;"));
}

function timeNow() {
  var date = new Date();
  var hours = date.getHours().toString();
  var minutes = date.getMinutes().toString();
  if(minutes.length == 1)
    minutes = "0" + minutes;
  return hours + ":" + minutes;
}

io.on('connection', function(socket) {
  socket.on('login', function(msg) {
    socket.urtela_id = msg;
    if((msg + "_") in nickMap) {
      socket.urtela_privilege = nickMap[msg + "_"];
    }
    else {
      socket.urtela_privilege = 0;
      nickMap[msg + "_"] = 0;
    }
    if(msg in nickMap) {
      if(nickMap[msg] in onlineNickMap) {
        while(nickMap[msg] in onlineNickMap) {
          nickMap[msg] += "_";
        }
      }
      socket.urtela_nick = nickMap[msg];
      onlineNickMap[nickMap[msg]] = msg;
    }
    else {
      var ok = false;
      while(!ok) {
        var nick = "";
        for(var i=0; i<5; ++i) {
          nick = nick + nickParts[Math.floor(Math.random() * nickParts.length)];
        }
        ok = !(nick in onlineNickMap);
        if(ok) {
          socket.urtela_nick = nick;
          nickChanged(msg, nick);
        }
      }
    }
    
    if(!(socket.urtela_id in channelsMap)) {
      try {
        var options = {};
        options["encoding"] = "utf-8";
        var channelData = fs.readFileSync(__dirname + "/save/user/" + socket.urtela_id, options);
        channelsMap[socket.urtela_id] = JSON.parse(channelData);
      }
      catch(err) {
        console.log(err);
      }
    }
    
    if(socket.urtela_id in channelsMap) {
      for(var channel in channelsMap[socket.urtela_id]) {
        socket.emit('your_channel', channel);
      }
    }
    else {
      socket.emit('your_channel', 'lobby');
    }
	
    socketMap[socket.urtela_id] = socket;
  });

  socket.on('part_channel', function(msg) {
    delete channelsMap[socket.urtela_id][msg];
    delete peopleInChannel[msg][socket.urtela_id];
    
    // notify all remaining people on the channel you were on, of your part
    for(var userId in peopleInChannel[msg]) {
      socketMap[userId].emit('user_part', timeNow() + '|' + msg + '|' + socket.urtela_nick);
    }
  });
  
  socket.on('disconnect', function() {
    for(var channel in channelsMap[socket.urtela_id]) {
      if(channel in peopleInChannel) {
        delete peopleInChannel[channel][socket.urtela_id];
      }
    }

    // free up your nick name
    delete onlineNickMap[nickMap[socket.urtela_id]];
    
    // notify all channels you were on, of your disconnect
    for(var channel in channelsMap[socket.urtela_id]) {
      for(var userId in peopleInChannel[channel]) {
        if(userId in socketMap) {
          socketMap[userId].emit('user_disconnect', timeNow() + '|' + channel + '|' + socket.urtela_nick);
        }
      }
    }
  });
  
  socket.on('query', function(msg) {
    console.log("got query");
    var split = msg.split("|");
    if(split.length >= 2) {
      var from = socket.urtela_nick;
      var to = split[0];
      var payload = split[1];
      for(var i=2; i<split.length; ++i) {
        payload = payload + ' ' + split[i];
      }

      if(!(to in idMap))
      {
        socket.emit('query', 'SYSTEM|' + socket.urtela_nick + '|' + to + ' is not online to reach your message');
        return;
      }
      if(!(idMap[to] in socketMap))
      {
        socket.emit('query', 'SYSTEM|' + socket.urtela_nick + '|' + to + ' is not online to reach your message');
        return;
      }
      
      console.log("sending: " + from + '|' + to + '|' + payload);
      socketMap[idMap[to]].emit('query', from + '|' + to + '|' + payload);
    }
  });
  
  socket.on('imdb', function(msg) {
    var channelSplit = msg.split("|");
    var channel = channelSplit[0];
    msg = channelSplit[1];
    for(var i=2; i<channelSplit.length; ++i) {
      msg = msg + '|' + channelSplit[i];
    }
    msg.replace(/\n/g, '<br/>');
    sendMessage(socket, channel, msg);
  });
 
  socket.on('chat message', function(msg) {
    var channelSplit = msg.split("|");
    var channel = channelSplit[0];
    msg = channelSplit[1];
    for(var i=2; i<channelSplit.length; ++i) {
      msg = msg + '|' + channelSplit[i];
    }
    
    if(msg.length > 0 && msg.charAt(0) == '/') {
      var splitMsg = msg.split(" ");
      if(splitMsg.length > 0) {
        if(splitMsg[0] == "/code") {
          if(splitMsg.length > 1) {
            var codeblock = splitMsg[1];
            for(var k=2; k<splitMsg.length; ++k) {
              codeblock = codeblock + " " + splitMsg[k];
            }
            var outputStr = nsh.highlight(codeblock, language);
            sendMessage(socket, channel, escapePipes(outputStr));
          }
        }
        else if(splitMsg[0] == "/me" || splitMsg[0] == "/emote") {
          var emoteBlock = splitMsg[1];
          for(var k=2; k<splitMsg.length; ++k) {
            emoteBlock = emoteBlock + " " + splitMsg[k];
          }
          emoteBlock = escapeHtml(emoteBlock);
          for(var userId in peopleInChannel[channel]) {
            if(userId in socketMap) {
              socketMap[userId].emit('chat message', timeNow() + '|' + channel + '|' + '<font color="orange">**</font>' + '|' + socket.urtela_nick + ' ' + emoteBlock);
            }
          }
        }
        else if(splitMsg[0] == "/join" || splitMsg[0] == "/j") {
          if(splitMsg.length > 1) {
            // notify people on the channel, of your join
            for(var userId in peopleInChannel[splitMsg[1]]) {
              if(userId in socketMap) {
                socketMap[userId].emit('user_join', timeNow() + '|' + splitMsg[1] + '|' + socket.urtela_nick);
              }
            }
            
            var channel = splitMsg[1];
            channel.replace(/|/g, '');
            if(channel.length > 15)
              channel = channel.substr(0, 15);
            
            if(!(socket.urtela_id in channelsMap)) {
              channelsMap[socket.urtela_id] = {};
            }
            channelsMap[socket.urtela_id][channel] = "";
            
            if(!(channel in peopleInChannel)) {
              peopleInChannel[channel] = {};
            }
            peopleInChannel[channel][socket.urtela_id] = "";
            
            if(!(channel in channelHistories)) {
              loadHistory(channel);
            }
            
            socket.emit('join_channel', channel);
            var history = channelHistories[channel];
            
            if(history.length > 200) {
              for(var line = history.length - 200; line < history.length; ++line) {
                socket.emit('chat message', history[line][0] + "|" + channel + "|" + history[line][1]);
              }
            }
            else {
              for(var line in history) {
                socket.emit('chat message', history[line][0] + "|" + channel + "|" + history[line][1]);
              }
            }
            
            // send people present in channel
            var peopleMsg = timeNow() + '|' + channel;
            for(user in peopleInChannel[channel]) {
              peopleMsg = peopleMsg + '|' + nickMap[user];
            }
          }
          if(channel in channelTopics) {
            socket.emit('topic', '|' + channel + '|' + channelTopics[channel]);
          }
          socket.emit('chat message', timeNow() + '|' + channel + '|<font color="red">SYSTEM</font>|Welcome to <font color="green">' + channel + '</font>, ' + socket.urtela_nick + '!');
          socket.emit('user_list', peopleMsg);
        }
        else if(splitMsg[0] == "/topic") {
          var newTopic = "";
          if(splitMsg.length > 1) {
            newTopic = escapeHtml(splitMsg[1]);
            for(var i=2; i<splitMsg.length; ++i) {
              newTopic += ' ' + escapeHtml(splitMsg[i]);
            }
          }
          channelTopics[channel] = newTopic;
          for(var userId in peopleInChannel[channel]) {
            if(userId in socketMap) {
              socketMap[userId].emit('topic', socket.urtela_nick + '|' + channel + '|' + newTopic);
            }
          }
        }
        else if(splitMsg[0] == "/nick") {
          if(splitMsg.length > 1) {
            splitMsg[1].replace(/|/g, '');
            splitMsg[1] = escapeHtml(splitMsg[1]);
            if(splitMsg[1].length > 14) {
              splitMsg[1] = splitMsg[1].substr(0, 14);
            }
            
            var ok = !(splitMsg[1] in onlineNickMap) && splitMsg[1].length > 0;
            if(ok) {
              var oldNick = socket.urtela_nick;
              delete idMap[socket.urtela_nick];
              delete onlineNickMap[oldNick];

              socket.urtela_nick = splitMsg[1];
              nickChanged(socket.urtela_id, splitMsg[1]);
              
              // notify all channels you were on, of your nick change.
              for(var userChannel in channelsMap[socket.urtela_id]) {
                for(var userId in peopleInChannel[userChannel]) {
                  if(userId in socketMap)
                    socketMap[userId].emit('nick_change', timeNow() + '|' + userChannel + '|' + oldNick + '|' + socket.urtela_nick);
                }
              }
            }
            else {
              socket.emit('chat message', timeNow() + "|" + channel + '|<font color="red">SYSTEM</color>|' + splitMsg[1] + " is already reserved. Try something else.");
            }
          }
        }
        else if(splitMsg[0] == "/html") {
          if(socket.urtela_privilege > 0) {
          if(splitMsg.length > 1) {
            var codeblock = splitMsg[1];
            for(var k=2; k<splitMsg.length; ++k) {
              codeblock = codeblock + " " + splitMsg[k];
            }
            try {
              libxmljs.parseXml(codeblock);
              if(codeblock.search("(%61|a)(%75|u)(%74|t)(%6F|%6f|o)(%70|p)(%6C|%6c|l)(%61|a)(%79|y)") != -1) {
                socket.emit('chat message', timeNow() + "|" + channel + '|<font color="red">SYSTEM</color>|Message did not pass manners test (autoplay). Thank you for your understanding.');
              }
              else {
                if(codeblock.search("(%69|i)(%66|f)(%72|r)(%61|a)(%6D|%6d|m)(%65|e)") != -1) {
                  socket.emit('chat message', timeNow() + "|" + channel + '|<font color="red">SYSTEM</color>|Message did not pass manners test (iframe). Thank you for your understanding.');
                }
                else {
	          sendMessage(socket, channel, escapePipes(codeblock));
                }
              }
            }
            catch(e) {
              socket.emit('chat message', timeNow() + "|" + channel + '|<font color="red">SYSTEM</color>|Message did not pass XML syntax check. Thank you for your understanding.');
            }
          }
          } else {
            socket.emit('chat message', timeNow() + "|" + channel + '|<font color="red">SYSTEM</color>|You do not have the required privileges to use the /html command. Thank you for your understanding.');
          }
        }
        else if(splitMsg[0] == password) {
          socket.urtela_privilege = 1;
          nickMap[socket.urtela_id + "_"] = 1;
          
          // notify all channels you are on, of your privilege level change.
          for(var userChannel in channelsMap[socket.urtela_id]) {
            for(var userId in peopleInChannel[userChannel]) {
              if(userId in socketMap)
                socketMap[userId].emit('chat message', timeNow() + '|' + userChannel + '|<font color="red">SYSTEM</color>|' + socket.urtela_nick + " has been granted elevated privileges");
            }
          }
        }
        else if(splitMsg[0] == "/elevate") {
          if(socket.urtela_privilege > 0) {
          if(splitMsg.length > 1) {
            var targetUser = splitMsg[1];
            if(targetUser in idMap) {
              var id = idMap[targetUser];
              socketMap[id].urtela_privilege = 1;
              nickMap[socketMap[id].urtela_id + "_"] = 1;
 
              // notify all channels you are on, of your privilege level change.
              for(var userChannel in channelsMap[socketMap[id].urtela_id]) {
                for(var userId in peopleInChannel[userChannel]) {
                  if(userId in socketMap)
                    socketMap[userId].emit('chat message', timeNow() + '|' + userChannel + '|<font color="red">SYSTEM</color>|' + socketMap[id].urtela_nick + " has been granted elevated privileges");
                }
              }

            }
          }
          }
        }
        else if(splitMsg[0] == "/demote") {
          if(socket.urtela_privilege > 0) {
          if(splitMsg.length > 1) {
            var targetUser = splitMsg[1];
            if(targetUser in idMap) {
              var id = idMap[targetUser];
              socketMap[id].urtela_privilege = 0;
              nickMap[socketMap[id].urtela_id + "_"] = 0;

              // notify all channels you are on, of your privilege level change.
              for(var userChannel in channelsMap[socketMap[id].urtela_id]) {
                for(var userId in peopleInChannel[userChannel]) {
                  if(userId in socketMap)
                    socketMap[userId].emit('chat message', timeNow() + '|' + userChannel + '|<font color="red">SYSTEM</color>|' + socketMap[id].urtela_nick + " has been plunged into demoted privileges.");
                }
              }

            }
          }
          }

        }
        else if(splitMsg[0] == "/invite") {
          if(splitMsg.length > 1) {
            var userName = splitMsg[1];
            if(userName in idMap) {
              if(idMap[userName] in socketMap) {
                socketMap[idMap[userName]].emit('your_channel', channel);
              }
            }
          }
        }
      }
    }
    else {
      msg = escapeHtml(msg).replace(/\n/g, '<br/>');
      sendMessage(socket, channel, msg);
    }
  });
});
