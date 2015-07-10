var client = null;

function checkUsernameCookie()
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
}

function initClient()
{
	client = new Object();
	client.unreadMessages = 0;
	client.activeChannel = "void";
	client.channelHistories = {};
	client.nicknames = {};
	client.userchannel = "";
	
	client.connect = function(url)
	{
		//alert("connect to "+url);
		
		checkUsernameCookie();
		
		client.socket = io.connect(url, { autoConnect: true});
		
		//socket on bind here?
		
		client.socket.emit('login', getCookie("username"));
		
		setCookie("username", getCookie("username"), 365);
		client.userchannel = getCookie("userchannel");
		
		if(client.userchannel == "")
		{
			setCookie("userchannel", "lobby", 365);
			client.userchannel = getCookie("userchannel");
		}
	}
	
	client.dump = function()
	{
		var str = "Client DUMP\n";
		
		for( var i in client)
		{
			str += (i+": "+client[i]+"\n");
		}
		log(str);
	}
}