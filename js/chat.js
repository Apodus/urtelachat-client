var ui = null;
var client = null;

function init()
{
	ui = new ChatUI();
	ui.setLoading("Loading Chat");
	setTimeout(function()
	{
		ui.setLoading(null);
		ui.messagesScrollToBottom();
	},3000);
	
	log("init");
	client = new ChatClient();
	
	ui.init(
		"#channels",
		"#messages",
		"#chat-topic"
	);
	
	ui.bindActions(
		setActiveChannel
	);
	
	client.bindStatusMessage(ui.setServerStatus);
	client.bindServerCommand(ui.serverCommand);
	
	client.connect("http://soulaim.dy.fi:3001");
	bindSocket();
	
	window.onfocus = function()
	{
		client.unreadMessages = 0;
		document.title = "Urtela Chat - " + timeNow();
	}
	
	/*
	document.onpaste = function(event)
	{
		var items = (event.clipboardData || event.originalEvent.clipboardData).items;
		var blob = items[0].getAsFile();
		var reader = new FileReader();
		reader.onload = function(event)
		{
			var img = document.createElement("img");
			img.src = event.target.result;
			$("#messages").append(img);
			client.socket.emit('chat message', client.activeChannel + "|" + event.target.result);
		};
		reader.readAsDataURL(blob);
	}
	*/
}

try
{
	$(document).ready(init);
}
catch(e)
{
	document.body.onload = function()
	{
		fatalError("Error while loading chat.<br/>please try again later.");
	}
}

function setActiveChannel(channel)
{
	log("client setActiveChannel: "+channel+" current:"+client.activeChannel);
	
	client.activeChannel = channel;
	
	// populate with history if available
	if(client.activeChannel in client.channelHistories)
	{
		for(var index in client.channelHistories[client.activeChannel])
		{
			ui.addLine(client.channelHistories[client.activeChannel][index][0], client.channelHistories[client.activeChannel][index][1], client.channelHistories[client.activeChannel][index][2]);
		}
	}

	ui.setTopic(client.getTopic(channel));
	ui.updateUsers(client.getUsers());
	ui.updateNotificationSettings();
}

function updateUserList(channel)
{
	if(client.activeChannel == channel)
	{
		ui.updateUsers(client.getUsers());
	}
}

function pushToChannelHistory(channel, time, who, what) {
  client.channelHistories[channel].push([time, who, what]);
  if(client.channelHistories[channel].length > 400) {
    client.channelHistories[channel].shift();
  }
}

function bindSocket()
{
	client.socket.on('server command', client.serverCommand);

client.socket.on('chat message', function(msg) {
  var splitMsg = msg.split("|");
  var time = splitMsg[0];
  var channel = splitMsg[1];
  var sender = splitMsg[2];
  var textLine = splitMsg[3];
  
  for(var i = 4; i < splitMsg.length; ++i) {
    textLine = textLine + "|" + splitMsg[i];
  }
  
  textLine = linkify(textLine);
  if(channel == client.activeChannel || channel == "") {
    ui.addLine(time, sender, textLine);
  }
  
  if(typeof client.channelHistories[channel] == "undefined") {
    client.channelHistories[channel] = [];
  }
  
  pushToChannelHistory(channel, time, sender, textLine);
  
  showDesktopNotification(channel, sender, textLine);
  
  if(channel != client.activeChannel) {
    ui.newContent(channel);
  }
});

client.socket.on('disconnect', function(msg) {
  ui.addLine(timeNow(), "SYSTEM", "Connection lost :(");
  notificationsTemporary = 0;
});

client.socket.on('your_channel', function(msg) {
  client.socket.emit('chat message', "|/join " + msg);
});

client.socket.on('nick_change', function(msg) {
  var parts = msg.split("|");
  var time = parts[0];
  var channel = parts[1];
  var nickOld = parts[2];
  var nickNew = parts[3];
  
  if(!(channel in client.nicknames)) {
    return;
  }
  
  delete client.nicknames[channel][nickOld];
  client.nicknames[channel][nickNew] = "";
  
  pushToChannelHistory(channel, timeNow(), '<font color="red">SYSTEM</font>', nickOld + " is now known as " + nickNew);
  
  if(client.activeChannel == channel) {
    ui.addLine(timeNow(), '<font color="red">SYSTEM</font>', nickOld + " is now known as " + nickNew);
  }
  
  updateUserList(channel);
});

client.socket.on('query', function(msg) {
  // from | to | what
  // todo: better ui for 1on1 messages
  console.log("got query: " + msg);

  var split = msg.split('|');
  if(split.length >= 3) {
    var from = split[0];
    var to = split[1];
    var what = split[2];
    ui.addLine(timeNow(), '<i>' + from + '</i>', '<i>' + to + '</i>: ' + what);
  }
});

client.socket.on('topic', function(msg) {
  var split = msg.split('|');
  if(split.length >= 3) {
    var who = split[0];
    var channel = split[1];
    var what = split[2];
    
	client.channelTopics[channel] = what;
	if(channel == client.activeChannel)
	{
		var topic = document.getElementById("chat-topic");
		topic.innerHTML = what;
	}
  }
});

client.socket.on('user_join', function(msg) {
  var parts = msg.split("|");
  var time = parts[0];
  var channel = parts[1];
  var user = parts[2];
  
  if(!(channel in client.nicknames)) {
    client.nicknames[channel] = {};
  }
  
  client.nicknames[channel][user] = "";
  
  if(!(channel in client.channelHistories)) {
    client.channelHistories[channel] = [];
  }
  
  pushToChannelHistory(channel, timeNow(), '<font color="green">' + user + '</font>', "joined the channel");
  
  if(client.activeChannel == channel) {
    ui.addLine(timeNow(), '<font color="green">' + user + '</font>', "joined the channel");
  }
  
  updateUserList(channel);
});

client.socket.on('reconnect', function(msg) {
  var myNode = document.getElementById("channels");
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  } 
  
  for(channel in client.channelHistories)
    delete client.channelHistories[channel];

  ui.clearChatMessages();
  client.socket.emit('login', getCookie("username"));
  notificationsTemporary = 0;
});

client.socket.on('user_part', function(msg) {
  var parts = msg.split("|");
  var time = parts[0];
  var channel = parts[1];
  var user = parts[2];
  
  delete client.nicknames[channel][user];
  
  pushToChannelHistory(channel, timeNow(), '<font color="red">' + user + '</font>', "left the channel");
  
  if(client.activeChannel == channel) {
    ui.addLine(timeNow(), '<font color="red">' + user + '</font>', "left the channel");
  }
  updateUserList(channel);
});

client.socket.on('user_disconnect', function(msg) {
  var parts = msg.split("|");
  var time = parts[0];
  var channel = parts[1];
  var user = parts[2];
  
  if(!(channel in client.nicknames)) {
    return;
  }
  
  delete client.nicknames[channel][user];
  
  pushToChannelHistory(channel, timeNow(), '<font color="red">' + user + '</font>', "disconnected");
  
  if(client.activeChannel == channel) {
    ui.addLine(timeNow(), '<font color="red">' + user + '</font>', "disconnected");
  }
  
  updateUserList(channel);
});

client.socket.on('user_list', function(msg) {
  var parts = msg.split("|");
  var time = parts[0];
  var channel = parts[1];
  if(!(channel in client.nicknames)) {
    client.nicknames[channel] = {};
  }
  for(var i=2; i<parts.length; ++i) {
    client.nicknames[channel][parts[i]] = "";
  }
  updateUserList(channel);
  notificationsTemporary = notificationsTemporary - 1; // join complete, reduce to mark it
});

client.socket.on('join_channel', function(msg)
{
	var existing = ui.initChannelButton(msg);
	if(existing)
	{
		// we are about to be bombarded with the history, better clear it out.
		delete client.channelHistories[msg];
	}
	ui.setActiveChannel(msg);
	
	client.nicknames[msg] = {};
	// join started, increase to mark it
	notificationsTemporary = notificationsTemporary + 1;
});

}