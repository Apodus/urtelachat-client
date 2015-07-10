function ChatClient()
{
	this.unreadMessages = 0;
	this.activeChannel = "void";
	this.channelHistories = {};
	this.nicknames = {};
	this.userchannel = "";
	this.socket = null;
	this.onStatusMessageChanged = function(msg)
	{
		log("Server Status: "+msg);
	};
	
	this.userchannel = getCookie("userchannel");
	if(this.userchannel == "")
	{
		setCookie("userchannel", "lobby", 365);
		this.userchannel = "lobby";
	}
	this.activeChannel = this.userchannel;
	
	this.checkUsernameCookie();
}
{
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
		this.onStatusMessageChanged = callback;
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
}