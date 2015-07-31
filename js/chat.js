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
		document.title = "LeChat - " + timeNow();
	}
	//ui.setLoading(null);
	
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

var myMsgIndex = 0;
var myMsgHistory = [''];

function historyUp() {
  myMsgHistory[myMsgIndex] = $('#message-input').val();
  myMsgIndex = myMsgIndex - 1;
  if(myMsgIndex < 0)
    myMsgIndex = myMsgHistory.length - 1;
  $('#message-input').val(myMsgHistory[myMsgIndex]);
}

function historyDown() {
  myMsgHistory[myMsgIndex] = $('#message-input').val();
  myMsgIndex = myMsgIndex + 1;
  if(myMsgIndex >= myMsgHistory.length)
    myMsgIndex = 0;
  $('#message-input').val(myMsgHistory[myMsgIndex]);
}

function swapChannel(next)
{
	var elem = document.getElementById('channel_' + client.activeChannel);
	var channel = (next==true ? elem.nextElementSibling : elem.previousSibling);
	
	if(channel == null)
	{
		channel = (next==true ? elem.parentNode.firstChild : elem.parentNode.lastChild);
	}
	channel = $(channel).find(".name").html();
	if(channel != null && channel != undefined)
	{	
		log("goto channel: "+channel);
		ui.setActiveChannel(channel);
	}	
}

$(function() {

  $("#message-input").keydown(function (e) {
    if(e.keyCode == '38' && !e.shiftKey) {
      e.preventDefault();
      historyUp();
    }
    else if(e.keyCode == '40' && !e.shiftKey) {
      e.preventDefault();
      historyDown();
    }
    else if(e.keyCode == '37' && e.altKey) {
      e.preventDefault();
      swapChannel();
    }
    else if(e.keyCode == '39' && e.altKey) {
      e.preventDefault();
      swapChannel(true);
    }
    else if(e.keyCode == '9') {
      // autocomplete
      e.preventDefault();
      var current = $('#message-input').val();
      var arrayCurrent = current.split(" ");
      if(arrayCurrent.length > 0) {
        var lastEntry = arrayCurrent[arrayCurrent.length - 1];
        var resultArray = [];
        for(var nickName in client.nicknames[client.activeChannel]) {
          if(lastEntry.length <= nickName.length) {
            if(nickName.toLowerCase().indexOf(lastEntry.toLowerCase()) == 0) {
              // found something
              resultArray.push(nickName);
              arrayCurrent[arrayCurrent.length - 1] = nickName;
              $('#message-input').val(arrayCurrent.join(" "));
            } 
          }
        }

        if(resultArray.length > 0) {
          if(resultArray.length == 1) {
            arrayCurrent[arrayCurrent.length - 1] = resultArray[0];
            $('#message-input').val(arrayCurrent.join(" "));
          }
          else {
            var lowerCaseResults = [];
            for (var str in resultArray) {
              lowerCaseResults.push(resultArray[str].toLowerCase());
            }
            
            var commonStr = sharedStart(lowerCaseResults);

            arrayCurrent[arrayCurrent.length - 1] = commonStr;
            $('#message-input').val(arrayCurrent.join(" "));
          }
        }
      }
    }
  });

  $("#message-input").keypress(function (e) {
    if(e.which == 13 && !e.shiftKey) {
      var msg = $('#message-input').val();
      if(msg == "") {
        e.preventDefault();
        return;
      }

      myMsgHistory.push(msg);
      myMsgIndex = 0;
      myMsgHistory[myMsgIndex] = '';

      var split = msg.split(" ");

      if(split[0] == "/part") {
        client.socket.emit('part_channel', client.activeChannel);
        removeActiveChannel();
      }
      else if(split[0] == "/clear") {
        delete client.channelHistories[client.activeChannel];
        ui.clearChatMessages();
      }
      else if(split[0] == "/query") {
        console.log("looks like query");
        if(split.length > 2) {
          var who = split[1];
          var what = split[2];
          for(var i=3; i<split.length; ++i)
            what += " " + split[i];
          console.log(who + '|' + what);
          client.socket.emit('query', who + '|' + what);
        }
      }
      else if(split[0] == "/imdb") {
        var sMovie = "";
        var splitMsg = msg.split(" ");
        for(var k=1; k<splitMsg.length; ++k) {
          if(sMovie != "")
            sMovie += " ";
          sMovie += splitMsg[k];
        }

        var sUrl = 'http://www.omdbapi.com/?t=' + sMovie + '&plot=short&type=movie&tomatoes=true';

        $.ajax(sUrl, {
            complete: function(p_oXHR, p_sStatus) {
            
            // addLine(timeNow(), '<color="green">IMDB</color>', p_oXHR.responseText);
            
            oData = $.parseJSON(p_oXHR.responseText);
            if("imdbID" in oData) {
            var movieDataString = "<div class=\"imdbwrap\"><div class=\"imdbtext\">";
            movieDataString += "<strong>" + oData.Title + "</strong> (" + oData.Year + ") (" + oData["Genre"] + ")  <br/>tomato meter: " + oData.tomatoMeter + "/100 (" + oData.tomatoImage + ")<br/>";
            movieDataString += "imdb score: " + oData["imdbRating"] + "<br/>";
            movieDataString += "<br/>What is it about:<br/>" + oData.Plot + "<br/>";
            movieDataString += "<br/>Tomato concensus:<br/>" + oData.tomatoConsensus + "<br/>";
            movieDataString += "</div><div class=\"imdbimg\">";
            movieDataString += "<a href=\"http://www.imdb.com/title/" + oData["imdbID"] +  "/\" target=\"_blank\"><img style=\"width:10em; height:15em;\" src=\"" + oData.Poster + "\"/></a>";
            movieDataString += "</div></div>";
            client.socket.emit('imdb', client.activeChannel + "|" + movieDataString);
            }
            else {
              addLine(timeNow(), "IMDB", "movie '" + sMovie  + "' not found :(");
            }
          }
        });
      }
      else {
        client.socket.emit('chat message', client.activeChannel + "|" + msg);
      }
      $('#message-input').val('');
      e.preventDefault();
    }
  });
});


var prevIsAlt = false;
var useChatMessageFade = true;

function addLine(time, who, what) {
  what = universe_jira_links(what);
  what = small_images(what);
  what = custom_emotes(what);	
  var messages = document.getElementById("messages");
  
  var useAlt = false;
  var sameUser = false;
  
  if(messages.lastChild) {
  try
  {
    if(messages.lastChild.firstChild.firstChild.innerHTML == who)
	{
		useAlt = prevIsAlt;
    }
    else
	{
      useAlt = !prevIsAlt;
    }
   }catch(e){}
  }
  var messageElement = null;
  var messageBody = null;
  
  if(prevIsAlt == useAlt && messages.lastChild && messages.lastChild.firstChild)
  {
	sameUser=true;
	messageBody = messages.lastChild.firstChild;
  }
  else
  {
    messageElement = document.createElement("div");
	messageElement.className = "message-block";
  
	messageBody = document.createElement("div");
	messageElement.appendChild(messageBody);
	
	messages.appendChild(messageElement);
	
	if(useChatMessageFade)
	{
		$(messageElement).hide();
		$(messageElement).fadeIn();
	}
	
	if(useAlt)
	{
		messageBody.className = "message-body bg-success row ";
	}
	else
	{
		messageBody.className = "message-body text-success row";
	}
  }
  
  prevIsAlt = useAlt;
  
  var elem_who = null;
  var elem_time= null;
  var elem_what = null;
	
	if(!sameUser)
	{
	  elem_who = document.createElement("span");
	  elem_who.className = "label label-success col-md-1 who user-label";
	  messageBody.appendChild(elem_who);
	  elem_who.innerHTML = who;
	}else{
		elem_who = messageBody.firstChild;
	}

	if(sameUser)
	{
		elem_what = elem_who.nextElementSibling;
		
		var newMessage = document.createElement("span");
		newMessage.innerHTML = "<br/>"+what;
		elem_what.appendChild(newMessage);
		
		if(useChatMessageFade)
		{
			$(newMessage).hide();
			$(newMessage).fadeIn();
		}
	}
	else
	{
		elem_what = document.createElement("div");
		elem_what.innerHTML = what;
		elem_what.className = "chat-message col-md-10";
		messageBody.appendChild(elem_what);
	}
  
	if(sameUser)
	{
		elem_time = elem_what.nextElementSibling;
		elem_time.innerHTML += "<br/>"+time;
	}
	else
	{
		elem_time = document.createElement("div");
		elem_time.innerHTML = time;
		elem_time.className = "time col-md-1 text-right";
		messageBody.appendChild(elem_time);
	}
  
  ui.messagesScrollToBottom();
    
  var selectionCount = document.querySelectorAll("#messages > div").length;
  for(var removeCounter = 400; removeCounter < selectionCount; ++removeCounter) {
    $('#messages').find('div:first').remove();
  }
  
}

function removeActiveChannel() {
  var elem = document.getElementById('channel_' + client.activeChannel);
  elem.parentNode.removeChild(elem);
  if(document.getElementById('channels').firstChild) {
    document.getElementById('channels').firstChild.click();
  }
  else {
    client.socket.emit('chat message', "|/join void");
  }
}



/*
title
The title that must be shown within the notification
options Optional
An object that allows to configure the notification. It can have the following properties:
dir : The direction of the notification; it can be auto, ltr, or rtl
lang: Specify the lang used within the notification. This string must be a valid BCP 47 language tag.
body: A string representing an extra content to display within the notification
tag: An ID for a given notification that allows to retrieve, replace or remove it if necessary
icon: The URL of an image to be used as an icon by the notification
*/

function notifyUser(channel, user, msg) {
  var notification = new Notification(channel + ": " + user, {"body": unwindHtml(msg), "icon":"http://urtela.redlynx.com/img/chaticon.jpg"});
  setTimeout(function(){ notification.close(); }, 5000);
  client.unreadMessages = client.unreadMessages + 1;
  document.title = client.unreadMessages.toString() + " unread!";
  window.focus();
}

function updateNotificationElement() {
  var toggle = document.getElementById('notifytoggle');
  var allow = getCookie(client.activeChannel + "_notify");
  if(allow == "") {
    allow = "allow"; // default;
  }
  
  if(allow == "allow") {
    toggle.innerHTML = "<strong>" + client.activeChannel + ":</strong> Notifications allowed";
	
	$("#notifytoggle").addClass("btn-success");
	
    toggle.onclick = function() {
      setCookie(client.activeChannel + "_notify", "forbid");
	  updateNotificationElement();
    }
  }
  else {
    toggle.innerHTML = "<strong>" + client.activeChannel + ":</strong> Notifications disabled";
	
	$("#notifytoggle").removeClass("btn-success");
	
    toggle.onclick = function() {
      setCookie(client.activeChannel + "_notify", "allow");
      updateNotificationElement();
    }
  }
}

function setActiveChannel(channel)
{
	log("client setActiveChannel: "+channel+" current:"+client.activeChannel);
	
	client.activeChannel = channel;
	
	useChatMessageFade = false;
  
  // populate with history if available
  if(client.activeChannel in client.channelHistories) {
    for(var index in client.channelHistories[client.activeChannel]) {
      addLine(client.channelHistories[client.activeChannel][index][0], client.channelHistories[client.activeChannel][index][1], client.channelHistories[client.activeChannel][index][2]);
    }
  }

  ui.setTopic(client.getTopic(channel));
  
  ui.updateUsers(client.getUsers());
  updateNotificationElement();
  
  useChatMessageFade = true;
}

function updateUserList(channel) {
  if(client.activeChannel == channel) {
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
    addLine(time, sender, textLine);
  }
  
  if(typeof client.channelHistories[channel] == "undefined") {
    client.channelHistories[channel] = [];
  }
  
  pushToChannelHistory(channel, time, sender, textLine);
  
  // if window has no focus & global notify setting & channel specific rules.
  if((notificationsTemporary == 0) && notificationsGlobal && (getCookie(channel + "_notify") != "forbid") && !document.hasFocus()) {
    notifyUser(channel, sender, textLine);
  }
  
  if(channel != client.activeChannel) {
    ui.newContent(channel);
  }
});

client.socket.on('disconnect', function(msg) {
  addLine(timeNow(), "SYSTEM", "Connection lost :(");
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
    addLine(timeNow(), '<font color="red">SYSTEM</font>', nickOld + " is now known as " + nickNew);
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
    addLine(timeNow(), '<i>' + from + '</i>', '<i>' + to + '</i>: ' + what);
  }
});

client.socket.on('topic', function(msg) {
  var split = msg.split('|');
  if(split.length >= 3) {
    var who = split[0];
    var channel = split[1];
    var what = split[2];
    log("Got channel "+channel+" topic:"+what);
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
    addLine(timeNow(), '<font color="green">' + user + '</font>', "joined the channel");
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
    addLine(timeNow(), '<font color="red">' + user + '</font>', "left the channel");
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
    addLine(timeNow(), '<font color="red">' + user + '</font>', "disconnected");
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
		ui.setActiveChannel(msg);
	}
	
	client.nicknames[msg] = {};
	// join started, increase to mark it
	notificationsTemporary = notificationsTemporary + 1;
});

}