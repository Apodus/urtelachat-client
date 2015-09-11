class CookieNames
{
	//static USER_ID:string = "userID";
	static USER_ID:string = "username";
	static USER_NAME:string = "userName";
	static ACTIVE_CHANNEL:string = "activeChannel";
}

class ChatData
{
	localMember:ChatMember;
	channels:Array<ChatChannel>;
	serverStatus:string;
	activeChannel:number;
	firstChannelSet:boolean;
	
	onChannelAdded:Signal;
	onChannelRemoved:Signal;
	onActiveChannelChanged:Signal;
	onActiveChannelMembersChanged:Signal;
	onActiveChannelMessageAdded:Signal;
	onChannelDataChanged:Signal;
	onChannelTopicChanged:Signal;
	onChannelMessageAdded:Signal;
	
	onMemberStatusChanged:Signal;
	onChannelSettingsChanged:Signal;
	onChannelLost:Signal;
	
	constructor()
	{
		var id:string = this.getCookie(CookieNames.USER_ID);
		var name:string = this.getCookie(CookieNames.USER_NAME);
		Debug.log("Got: "+id);
		
		if(id == null || id == "")
		{
			id = Math.floor((Math.random() * 1000000000) + 1).toString();
			this.setCookie(CookieNames.USER_ID, id, 365);
			name = "guest";
		}
		this.firstChannelSet=false;
		this.onChannelAdded = new Signal();
		this.onChannelRemoved = new Signal();
		this.onActiveChannelChanged = new Signal();
		this.onActiveChannelMembersChanged = new Signal();
		this.onActiveChannelMessageAdded = new Signal();
		this.onChannelDataChanged = new Signal();
		this.onChannelTopicChanged = new Signal();
		this.onChannelSettingsChanged = new Signal();
		
		this.onChannelMessageAdded = new Signal();
		
		this.onMemberStatusChanged = new Signal();
		this.onChannelLost = new Signal();
		
		this.localMember = new ChatMember(name,id,"Disconnected");
		this.serverStatus = "Connecting...";
		this.channels = new Array<ChatChannel>();
		this.activeChannel = 0;
	}
	getActiveChannel():ChatChannel
	{
		return this.getChannel(this.activeChannel);
	}
	getChannel(id:number):ChatChannel
	{
		Debug.assert(this.channels[id]!=null,"Channel "+id+" is null!");
		return this.channels[id];
	}
	initChannel(name:string):ChatChannel
	{
		for(var i:number =0; i < this.channels.length; i++)
		{
			if(this.channels[i].name === name)
			{
				return this.channels[i];
			}
		}
		var channel:ChatChannel = new ChatChannel(name,"Welcome to "+name);
		if(name[0]=="@")
		{
			channel.topic = "Private chat with "+name.substring(1);
		}
		this.addChannel(channel);
		return channel;
	}
	addChannel(channel:ChatChannel)
	{
		this.checkChannelSettings(channel);
		
		for(var i:number =0; i < this.channels.length; i++)
		{
			if(this.channels[i].name === channel.name)
			{
				Debug.warning("Adding already Existing channel!");
				return;
			}
		}
		
		this.channels.push(channel);
		this.onChannelAdded.send(channel);
		
		//Check if no channel is active
		if(!this.firstChannelSet || channel.name == this.getStoredChannel())
		{
			this.firstChannelSet=true;
			this.setActiveChannel(this.channels.length-1);
		}
	}
	removeChannelByName(channelName:string)
	{
		if(this.channels.length<=1)
		{
			Debug.warning("Can't remove last channel");
			return false;
		}
		
		for(var i:number =0; this.channels.length; i++)
		{
			if(this.channels[i].name === channelName)
			{
				this.onChannelRemoved.send(this.channels[i]);
				this.channels.splice(i,1);
				this.setActiveChannel(Math.max(0,i-1));
				return true;
			}
		}
		Debug.warning("Can't remove channel: "+channelName);
		return true;
	}
	setActiveChannel(id:number)
	{
		this.activeChannel = id;
		var channel:ChatChannel = this.getActiveChannel();
		Debug.log("Set Active channel: "+channel.name);
		this.onActiveChannelChanged.send(this.getActiveChannel());
		this.setCookie(CookieNames.ACTIVE_CHANNEL,channel.name,365);
	}
	setActiveChannelByName(name:string)
	{
		for(var i:number = 0; i < this.channels.length; i++)
		{
			if(this.channels[i].name == name)
			{
				this.setActiveChannel(i);
				return;
			}
		}
		
		Debug.warning("Can't setActiveChannelByName! "+name);
		this.setActiveChannel(0);
	}
	
	setActiveChannelByChannel(channel:ChatChannel)
	{
		for(var i:number = 0; i < this.channels.length; i++)
		{
			if(this.channels[i]==channel)
			{
				this.setActiveChannel(i);
				return;
			}
		}
		Debug.warning("Can't setActiveChannelByChannel! "+channel.name);
		this.setActiveChannel(0);
	}
	addMessage(message:ChatMessage,channelName:string)
	{
		if(message.type == ChatMessageType.SYSTEM && channelName == "")
		{
			channelName = this.getActiveChannel().name;
		}
		
		var channel:ChatChannel = this.initChannel(channelName);
		channel.addMessage(message);
		if(channel==this.getActiveChannel())
		{
			this.onActiveChannelMessageAdded.send(message);
		}
		this.onChannelMessageAdded.send(channel,message);
	}
	addMember(member:ChatMember,channelName:string)
	{
		var channel:ChatChannel = this.getChannelByName(channelName);
		channel.addMember(member);
		if(channel==this.getActiveChannel())
		{
			this.onActiveChannelMembersChanged.send(channel);
		}
	}
	removeMember(member:ChatMember,channelName:string)
	{
		var channel:ChatChannel = this.getChannelByName(channelName);
		channel.removeMember(member);
		if(channel==this.getActiveChannel())
		{
			this.onActiveChannelMembersChanged.send(channel);
		}
	}
	removeMemberByName(member:string,channelName:string)
	{
		var channel:ChatChannel = this.getChannelByName(channelName);
		channel.removeMemberByName(member);
		if(channel==this.getActiveChannel())
		{
			this.onActiveChannelMembersChanged.send(channel);
		}
	}
	getChannelByName(name:string):ChatChannel
	{
		for(var i:number =0; this.channels.length; i++)
		{
			if(this.channels[i].name === name)
			{
				return this.channels[i];
			}
		}
		var channel:ChatChannel = new ChatChannel(name,"Welcome to "+name);
		this.addChannel(channel);
		return channel;
	}
	setTopic(topic:string,channelName:string)
	{
		var channel:ChatChannel = this.getChannelByName(channelName);
		channel.topic = topic;
		this.onChannelTopicChanged.send(channel);
	}
	getStoredChannel():string
	{
		return this.getCookie(CookieNames.ACTIVE_CHANNEL);
	}
	restoreActiveChannel()
	{
		var stored:string = this.getStoredChannel();
		Debug.log("restoreActiveChannel:"+stored);
		if(stored == null || stored == "" || stored == "null")
		{
			this.activeChannel = 0;
			//this.setActiveChannelByName("lobby");
			return;
		}
		
		for(var i:number = 0; this.channels.length; i++)
		{
			if(this.channels[i].name === stored)
			{
				this.setActiveChannelByName(stored);
				return;
			}
		}
		
		Debug.log("Can't restore active channel, try to join later.");
		//this.onChannelLost.send(stored);
	}
	
	setCookie(cname:string, cvalue:string, exdays:number)
	{
		Debug.log("Set cookie:"+cname+": "+cvalue);
		var d:Date = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires:string = "expires="+d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}

	getCookie(cname:string)
	{
		var name:string = cname + "=";
		var ca:Array<string> = document.cookie.split(';');
		for(var i:number=0; i<ca.length; i++)
		{
			var c:string = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1);
			if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
		}
		return null;
	}
	setUserData(userName:string,data:any)
	{
		//channel: "roi"
		//is_op: false
		//user: "fazias"

		var channel:ChatChannel = this.getChannelByName(data.channel);
	
		for(var j:number = 0 ; j < channel.members.length; j++)
		{
			var member:ChatMember = channel.members[j];
			if(member.name == userName)
			{
				member.setOpStatus(data.channel,data.is_op);
				this.onMemberStatusChanged.send(member);
				
				if(channel == this.getActiveChannel())
				{
					this.onActiveChannelMembersChanged.send(channel);
				}
				
				return;
			}
		}
	}
	setChannelData(channelName:string,key:string,value:string)
	{
		for(var i:number = 0 ; i < this.channels.length; i++)
		{
			var channel:ChatChannel = this.channels[i];
			if(channel.name == channelName)
			{
				channel.setData(key,value);
				this.onChannelDataChanged.send(channel);
				return;
			}
		}
	}
	setUserStatus(userName:string,status:string)
	{
		for(var i:number = 0 ; i < this.channels.length; i++)
		{
			var channel:ChatChannel = this.channels[i];
		
			for(var j:number = 0 ; j < channel.members.length; j++)
			{
				if(channel.members[j].name == userName)
				{
					//var oldStatus:string = channel.members[j].status;
					channel.members[j].status = status;
					this.onMemberStatusChanged.send(channel.members[j]);
				}
			}
			
			if(this.activeChannel == i)
			{
				this.onActiveChannelMembersChanged.send(channel);
			}
		}
	}
	updateUsers(channelName:string,users:Array<string>)
	{
		var channel:ChatChannel = this.getChannelByName(channelName);
		
		for(var i:number = 0 ; i < users.length; i++)
		{
			channel.setupUser(users[i]);
		}
		
		this.onActiveChannelMembersChanged.send(channel);
	}
	changeMemberName(oldName:string,newName:string)
	{
		for(var i:number = 0 ; i < this.channels.length; i++)
		{
			var channel:ChatChannel = this.channels[i];
		
			for(var j:number = 0 ; j < channel.members.length; j++)
			{
				if(channel.members[j].name == oldName)
				{
					channel.members[j].name = newName;
					this.addMessage(new ChatMessage("",oldName,"Changed name to "+newName,ChatMessageType.SYSTEM),channel.name);
				}
			}
		}
		var channel:ChatChannel = this.getActiveChannel();
		this.onActiveChannelMembersChanged.send(channel);
	}
	checkChannelSettings(channel:ChatChannel)
	{
		//Notification
		var cookie:string = this.getChannelSetting(channel,"notification");
		channel.allowNotifications = cookie === "true";
		
		//cookie = this.getCookie(channel.name+"_notification");
		//channel.allowNotifications = notification === "allow";
		this.onChannelSettingsChanged.send(channel);
	}
	setChannelSetting(channel:ChatChannel,setting:string,value:string)
	{
		this.setCookie(channel.name+"_"+setting,value,365);
		this.checkChannelSettings(channel);
	}
	getChannelSetting(channel:ChatChannel,setting:string)
	{
		var cookie:string = this.getCookie(channel.name+"_"+setting);
		return cookie;
	}
	toggleChannelSetting(channel:ChatChannel,setting:string)
	{
		var value:string = this.getChannelSetting(channel,setting);
		Debug.log("Toggle "+channel.name+" "+setting+" from:"+value);
		if(value === "true")
		{
			this.setChannelSetting(channel,setting,"false");
		}
		else
		{
			this.setChannelSetting(channel,setting,"true");
		}
		this.onChannelSettingsChanged.send(channel);
	}
}