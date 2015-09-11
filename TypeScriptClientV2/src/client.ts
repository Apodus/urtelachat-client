/// <reference path="..\ref\socket.io-client\socket.io-client.d.ts" />

class Client
{
	url:string;
	socket:SocketIOClient.Socket;
	isConnected:boolean;
	
	onServerStatusChanged:Signal;
	onUserStatusUpdated:Signal;
	onChatMessage:Signal;
	onJoinedChannel:Signal;
	onUserListUpdated:Signal;
	onUserParted:Signal;
	onUserJoined:Signal;
	onUserDisconnected:Signal;
	onUserNameChanged:Signal;
	onTopicChanged:Signal;
	onDisconnected:Signal;
	onReconnect:Signal;
	onConnected:Signal;
	onLogMessage:Signal;
	onServerCommand:Signal;
	onReceiveLocalUsername:Signal;
	onReceiveUserData:Signal;
	onReceiveChannelData:Signal;
	
	constructor()
	{
		this.isConnected = false;
		this.onServerStatusChanged = new Signal();
		this.onUserStatusUpdated = new Signal();
		this.onChatMessage = new Signal();
		this.onJoinedChannel = new Signal();
		this.onUserListUpdated = new Signal();
		this.onUserParted = new Signal();
		this.onUserJoined = new Signal();
		this.onUserDisconnected = new Signal();
		this.onUserNameChanged = new Signal();
		this.onTopicChanged = new Signal();
		this.onDisconnected = new Signal();
		this.onReconnect = new Signal();
		this.onConnected = new Signal();
		this.onLogMessage = new Signal();
		this.onServerCommand = new Signal();
		this.onReceiveLocalUsername = new Signal();
		this.onReceiveUserData = new Signal();
		this.onReceiveChannelData = new Signal();
	}
	changeServerStatus(status:string)
	{
		this.onServerStatusChanged.send(status);
		Debug.log("Server: "+status);
	}
	connect(url:string,user:string)
	{
		if(this.isConnected && this.url == url)
		{
			Debug.log("Already connected to "+url);
			return;
		}
		
		this.url = url;
		this.changeServerStatus("Connecting to: "+url);
		
		this.socket = io.connect(url, { autoConnect: true});
		
		this.bindSocket();
		
		this.changeServerStatus("Connected");
		this.changeServerStatus("Logging in as "+user);
		
		this.sendData('login', user);
		
		this.isConnected = true;
	}
	log(msg:string)
	{
		Debug.log(msg);
		this.onLogMessage.send(msg);
	}
	bindSocket()
	{
		this.log("Binding socket...");
		var client:Client = this;
		
		this.socket.on('server command', function(msg:string) { client.serverCommand(msg); });
		this.socket.on('your_channel', function(msg:string) { client.joinChannel(msg); });
		this.socket.on("status", function(data:string) { client.userStatusUpdated(data); });
		this.socket.on("chat message", function(data:string) { client.receiveChatMessage(data); });
		this.socket.on("system message", function(data:string) { client.receiveSystemMessage(data); });
		this.socket.on('data message', function(msg:string) { client.receiveDataMessage(msg); });
		this.socket.on('join_channel', function(channelName:string) { client.joinedChannel(channelName); });
		this.socket.on('user_list', function(data:string) { client.userListUpdated(data); });
		this.socket.on('user_disconnected', function(data:string) { client.userDisconnected(data); });
		this.socket.on('user_part', function(data:string) { client.userParted(data); });
		this.socket.on('user_join', function(data:string) { client.userJoined(data); });
		this.socket.on('nick_change', function(data:string) { client.userNameChanged(data); });
		this.socket.on('topic', function(data:string) { client.topicChanged(data); });
		this.socket.on('disconnect', function(data:string) { client.disconnected(data); });
		this.socket.on('reconnect', function(data:string) { client.reconnected(); });
		this.socket.on('login_complete', function(data:string) { client.connected(data); });
		this.socket.on('your_nick', function(data:string) { client.receiveLocalUser(data); });
		this.socket.on('op', function(data:string) { client.receiveUserData(data); });
		this.socket.on('channelmod', function(data:string) { client.receiveChannelData(data); });
	}
	receiveChannelData(data:string)
	{
		this.onReceiveChannelData.send(data);
	}
	receiveUserData(data:Object)
	{
		this.onReceiveUserData.send(data);
	}
	receiveLocalUser(localUserName:string)
	{
		this.onReceiveLocalUsername.send(localUserName);
	}
	serverCommand(data:string)
	{
		this.onServerCommand.send(data);
	}
	receiveChatMessage(data:string)
	{
		var splitMsg:Array<string> = data.split("|");
	
		var time:string = splitMsg.shift();
		var channel:string = splitMsg.shift();
		var sender:string = splitMsg.shift();
		var textLine:string = splitMsg.join("|");
		
		this.onChatMessage.send(new ChatMessage(
			time,
			sender,
			textLine,
			ChatMessageType.NORMAL
		),channel);
	}
	receiveSystemMessage(data:string)
	{
		var splitMsg:Array<string> = data.split("|");
	
		var channel:string = splitMsg.shift();
		var time:string = splitMsg.shift();
		var textLine:string = splitMsg.join("|");
		
		this.onChatMessage.send(new ChatMessage(
			time,
			"SYSTEM",
			textLine,
			ChatMessageType.SYSTEM
		),channel);
		
		this.log(time+": "+textLine);
	}
	receiveDataMessage(data:string)
	{
		var splitMsg:Array<string> = data.split("|");
	
		var channel:string = splitMsg.shift();
		var time:string = splitMsg.shift();
		var textLine:string = splitMsg.join("|");
		
		this.onChatMessage.send(new ChatMessage(
			time,
			"SYSTEM",
			textLine,
			ChatMessageType.DATA
		),channel);
		this.log(time+":"+textLine);
	}
	joinedChannel(channelName:string)
	{
		this.onJoinedChannel.send(channelName);
		this.log("Joined channel:"+channelName);
	}
	userStatusUpdated(msg:string)
	{
		var data:Array<string> = msg.split("|");
		var time:string = data[0];
		var channel:string = data[1];
		var sender:string = data[2];
		var status:string = data[3];
		
		this.onUserStatusUpdated.send(sender,status,channel);
	}
	uploadFile(file:any,channel:ChatChannel)
	{
		this.log("Attempt uploading File Type:"+file.type);
		if(file.type.search("image") != -1)
		{
			this.sendData('upload img', channel.name + '|' + file.name);
		}
		else
		{
			this.sendData('upload file', channel.name + '|' + file.name);
		}
	}
	uploadImageData(data:string,channel:ChatChannel)
	{
		Debug.log("Uploading image data: "+data);
		this.sendData('data message', {type:"imagePaste",channel:channel.name,image:data});
	}
	exitChannel(channel:ChatChannel)
	{
		this.log("Exit channel:"+channel.name);
		this.sendData('part_channel', channel.name);
	}
	joinChannel(channelName:string)
	{
		this.log("Joining channel:"+channelName);
		this.sendData('chat message', "|/join " + channelName);
	}
	sendPrivateChat(target:ChatMember,msg:string)
	{
		msg = "@"+target.name + "|" + msg;
		this.sendData("chat message", msg);
	}
	sendData(key:string,data:any)
	{
		Debug.debugLog("Socket emit: "+key+" = "+data);
		
		if(this.socket == null || data == "" || key == "")
		{
			return;
		}
		Debug.log("SEND: "+key+": "+data);
		this.socket.emit(key,data);
	}
	setStatus(status:string)
	{
		this.sendData("status",status);
	}
	sendMessage(msg:string,channel:ChatChannel)
	{
		var split:Array<string> = msg.split(" ");

		if(split[0] == "/part")
		{
			this.exitChannel(channel);
			return;
		}
		
		if(split[0] == "/join")
		{
			this.joinChannel(split[1]);
			return;
		}
		
		if(split[0] == "/status")
		{
			split.shift();
			this.setStatus(split.join(" "));
			return;
		}
		
		if(split[0] == "/marker")
		{
			//TODO
			return;
		}
		
		if(split[0] == "/mod")
		{
			var key:string = split[1];
			var val:string = split[2];
			
			this.sendData("channelmod",{mod:key,value:val,channel:channel.name});
			return;
		}

		if(split[0] == "/imdb")
		{
			var sMovie:string = "";
			var splitMsg:Array<string> = msg.split(" ");
			for(var k:number=1; k<splitMsg.length; ++k)
			{
				if(k>1) sMovie += " ";
				
				sMovie += splitMsg[k];
			}

			var sUrl:string = 'http://www.omdbapi.com/?t=' + sMovie + '&plot=short&type=movie&tomatoes=true';
			
			var client:Client = this;

			$.ajax(sUrl,{
				complete: function(p_oXHR, p_sStatus)
				{
					var oData:any = $.parseJSON(p_oXHR.responseText);
					if("imdbID" in oData) 
					{
						var movieDataString = "<div class=\"well imdbwrap\"><div class=\"imdbtext\">";
						movieDataString += "<strong>" + oData.Title + "</strong> (" + oData.Year + ") (" + oData["Genre"] + ")  <br/>tomato meter: " + oData.tomatoMeter + "/100 (" + oData.tomatoImage + ")<br/>";
						movieDataString += "imdb score: " + oData["imdbRating"] + "<br/>";
						movieDataString += "<br/>What is it about:<br/>" + oData.Plot + "<br/>";
						movieDataString += "<br/>Tomato concensus:<br/>" + oData.tomatoConsensus + "<br/>";
						movieDataString += "</div><div class=\"imdbimg\">";
						movieDataString += "<a href=\"http://www.imdb.com/title/" + oData["imdbID"] +  "/\" target=\"_blank\"><img style=\"width:10em; height:15em;\" src=\"" + oData.Poster + "\"/></a>";
						movieDataString += "</div></div>";
						client.sendData('imdb', channel.name + "|" + movieDataString);
					}
					else
					{
						Debug.log("movie '" + sMovie  + "' not found :(");
					}
				}
			});
			return;
		}
		
		this.sendData("chat message", channel.name + "|" + msg);
	}
	userListUpdated(data:string)
	{
		var parts:Array<string> = data.split("|");
		var time = parts.shift();
		var channel = parts.shift();
		this.onUserListUpdated.send(channel,parts);
	}
	userJoined(data:string)
	{
		var parts:Array<string> = data.split("|");
		var time:string = parts[0];
		var channel:string = parts[1];
		var user:string = parts[2];
		
		this.onUserJoined.send(channel,user);
	}
	userParted(data:string)
	{
		var parts:Array<string> = data.split("|");
		var time:string = parts[0];
		var channel:string = parts[1];
		var user:string = parts[2];
		
		this.onUserParted.send(channel,user);
	}
	userDisconnected(data:string)
	{
		var parts:Array<string> = data.split("|");
		var time:string = parts[0];
		var channel:string = parts[1];
		var user:string = parts[2];
		
		this.onUserDisconnected.send(channel,user);
	}
	userNameChanged(data:string)
	{
		var parts:Array<string> = data.split("|");
		var time:string = parts[0];
		var channel:string = parts[1];
		var nickOld:string = parts[2];
		var nickNew:string = parts[3];
		
		this.onUserNameChanged.send(nickOld,nickNew);
	}
	topicChanged(data:string)
	{
		var split:Array<string> = data.split('|');
		if(split.length >= 3)
		{
			var who:string = split[0];
			var channel:string = split[1];
			var what:string = split[2];
			
			this.onTopicChanged.send(channel,what);
		}
		this.log(channel+" topic changed");
	}
	reconnected()
	{
		this.isConnected = false;
		Debug.log("Reconnect!");
		this.onReconnect.send("null");
	}
	disconnected(data:any)
	{
		this.isConnected = false;
		this.onDisconnected.send("null");
		this.changeServerStatus("Disconnected");
	}
	connected(data:string)
	{
		this.onConnected.send(data);
		this.changeServerStatus("Connected");
	}
}