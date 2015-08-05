function ChatClient()
{
	this.unreadMessages = 0;
	this.activeChannel = "void";
	this.channelHistories = {};
	this.nicknames = {};
	this.channelTopics = {};

	this.socket = null;
	this.onStatusMessageChanged = function(msg)
	{
		log("Server Status: "+msg);
	};
	
	this.activeChannel = "lobby";
	
	this.checkUsernameCookie();
	
	this.onServerCommand = null;
}
{
	ChatClient.prototype.getTopic = function(channel)
	{
		var topic = "Welcome to " + channel;
		if(channel in this.channelTopics)
		{
			topic = this.channelTopics[channel];
		}
		return topic;
	}
	
	ChatClient.prototype.getUsers = function(channel)
	{
		if(channel==null || this.nicknames[channel] == null)
		{
			return this.nicknames[this.activeChannel];
		}
		else
		{
			return this.nicknames[channel];
		}
	}
	
	ChatClient.prototype.exitChannel = function(channel)
	{
		this.socket.emit('part_channel', channel);
	}
	
	ChatClient.prototype.updateUserStatus = function(data)
	{
		data = data.split("|");
		var time = data[0];
		var channel = data[1];
		var sender = data[2];
		var status = data[3];
		
		ui.addLine(time,"SYSTEM",sender + " is now "+status,true,channel);
		ui.updateUsers(client.getUsers());
	}
	
	ChatClient.prototype.startPrivateChat = function(targetUser,msg)
	{
		log("Start query:"+targetUser+"|"+msg);
		this.socket.emit('query', targetUser + '|' + msg);
	}
	
	ChatClient.prototype.checkUsernameCookie = function()
	{
		var user = getCookie("username");
		//alert("checkUsernameCookie:"+user);
		if (user == "")
		{
			user = Math.floor((Math.random() * 1000000000) + 1).toString();
			if (user != "" && user != null)
			{
				setCookie("username", user, 365);
			}
		}
		log("Resolved UID: " + user);
	}
	
	ChatClient.prototype.bindStatusMessage = function(callback)
	{
		log("Binding server status message handler.");
		this.onStatusMessageChanged = callback;
	}
	
	ChatClient.prototype.bindServerCommand = function(callback)
	{
		log("Binding server command handler.");
		this.onServerCommand = callback;
	}

	ChatClient.prototype.connect = function(url)
	{
		this.onStatusMessageChanged("connecting...");
			
		this.socket = io.connect(url, { autoConnect: true});
			
		//socket on bind here?
		
		this.onStatusMessageChanged("Logging in as "+getCookie("username"));
		
		var myUserName = getCookie("username");
		if(myUserName == "") { // dev env
			myUserName = Math.floor(Math.random() * 1000000000 + 1).toString();
		}
		this.socket.emit('login', myUserName);
		
		setCookie("username", getCookie("username"), 365);
		this.onStatusMessageChanged("Connected");
	}

	ChatClient.prototype.dump = function()
	{
		var str = "Client DUMP\n";
		
		for( var i in this)
		{
			str += (i+": "+this[i]+"\n");
		}
		log(str);
	}
	
	ChatClient.prototype.serverCommand = function(command)
	{
		log("Server command: "+command);
		if(this.onServerCommand==null)
		{
			log("No command handler ser!");
			return;
		}
		this.onServerCommand(command);
	}
}