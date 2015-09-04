enum ChatMessageType
{
	NORMAL,
	SYSTEM
}

class CookieNames
{
	static USER_ID:string = "userID";
	static USER_NAME:string = "userName";
	static ACTIVE_CHANNEL:string = "activeChannel";
}

class Signal
{
	callbacks:Array<Function>;
	constructor()
	{
		this.callbacks = new Array<Function>();
	}
	add(f:Function)
	{
		this.callbacks.push(f);
	}
	remove(f:Function)
	{
		for(var i:number = 0; i<this.callbacks.length; i++)
		{
			if(this.callbacks[i]==f)
			{
				this.callbacks.splice(i,1);
				return;
			}
		}
		Debug.assert(false,"Can't remove callback!");
	}
	send(data:any, ...args:any[])
	{
		for(var i:number = 0; i<this.callbacks.length; i++)
		{
			this.callbacks[i](data,args);
		}
	}
}

class ChatMessage
{
	time:string;
	sender:string;
	message:string;
	type:ChatMessageType;
	constructor(time:string,sender:string,message:string,type:ChatMessageType)
	{
		this.time=time;
		this.sender=sender;
		this.message=message;
		this.type=type;
	}
}

class ChatMember
{
	name:string;
	userID:string;
	status:string;
	constructor(name:string,id:string,status:string)
	{
		this.name = name;
		this.userID = id;
		this.status = status;
	}
}

class ChatChannel
{
	name:string;
	topic:string;
	plugins:Array<string>;
	messages:Array<ChatMessage>;
	members:Array<ChatMember>;
	id:number;
	static nextID:number = 0;
	constructor(name:string,topic:string)
	{
		this.id = ChatChannel.nextID++;
		this.name=name;
		this.topic=topic;
		this.messages = new Array<ChatMessage>();
		this.members = new Array<ChatMember>();
	}
	addMember(member:ChatMember)
	{
		this.members.push(member);
		Debug.log("Added member: "+member.name+" to "+this.name);
	}
	
	removeMemberByName(member:string)
	{
		for(var i: number = 0; i<this.members.length; i++)
		{
			if(this.members[i].name == member)
			{
				Debug.log("Removing member: "+member);
				this.members.splice(i,1);
				return;
			}
		}
		Debug.log("Can't remove member: "+member);
	}
	removeMember(member:ChatMember)
	{
		for(var i: number = 0; i<this.members.length; i++)
		{
			if(this.members[i] == member)
			{
				Debug.log("Removing member: "+member.name);
				this.members.splice(i,1);
				return;
			}
		}
		Debug.log("Can't remove member: "+member.name);
	}
	addMessage(message:ChatMessage)
	{
		this.messages.push(message);
	}
	setupUser(username:string)
	{
		for(var i: number = 0; i<this.members.length; i++)
		{
			if(this.members[i].name == username)
			{
				return;
			}
		}
		
		this.addMember(new ChatMember(username,"null","online"));
	}
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
	onActiveChannelDataAdded:Signal;
	onChannelTopicChanged:Signal;
	onChannelMessageAdded:Signal;
	onServerStatusChanged:Signal;
	onMemberStatusChanged:Signal;
	
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
		this.onActiveChannelDataAdded = new Signal();
		this.onChannelTopicChanged = new Signal();
		
		this.onChannelMessageAdded = new Signal();
		
		this.onServerStatusChanged = new Signal();
		
		this.onMemberStatusChanged = new Signal();
		
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
	addChannel(channel:ChatChannel)
	{
		for(var i:number =0; i < this.channels.length; i++)
		{
			if(this.channels[i].name === channel.name)
			{
				Debug.assert(false,"Adding already Existing channel!");
				return;
			}
		}
		
		this.channels.push(channel);
		this.onChannelAdded.send(channel);
		
		//Check if no channel is active
		if(!this.firstChannelSet)
		{
			this.firstChannelSet=true;
			this.setActiveChannel(this.channels.length-1);
		}
	}
	removeChannel(channelName:string)
	{
		for(var i:number =0; this.channels.length; i++)
		{
			if(this.channels[i].name === channelName)
			{
				this.onChannelRemoved.send(this.channels[i]);
				this.channels.splice(i,1);
				this.setActiveChannel(i);
				return;
			}
		}
		Debug.warning("Can't remove channel: "+channelName);
	}
	setActiveChannel(id:number)
	{
		this.activeChannel = id;
		var channel:ChatChannel = this.getActiveChannel();
		Debug.assert(channel!=null,"Active channel is lost!");
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
		
		Debug.assert(false,"Can't setActiveChannelByName! "+name);
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
		Debug.assert(false, "Can't setActiveChannelByChannel! "+channel.name);
		this.setActiveChannel(0);
	}
	addMessage(message:ChatMessage,channelName:string)
	{
		var channel:ChatChannel = this.getChannelByName(channelName);
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
	restoreActiveChannel()
	{
		var stored:string = this.getCookie(CookieNames.ACTIVE_CHANNEL);
		Debug.log("restoreActiveChannel:"+stored);
		if(stored == null || stored == "")
		{
			this.setActiveChannelByName("lobby");
			return;
		}
		this.setActiveChannelByName(stored);
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
}