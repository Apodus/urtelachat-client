
class Chat
{
	private client:Client;
	private ui:Userinterface;
	private data:ChatData;
	constructor()
	{
		Debug.log(Project.name+" "+Project.version+" CodeName:"+Project.codeName);
		//Error Handler
		var chat:Chat = this;
		Debug.setErrorHandler(function(msg:string)
		{
			//alert("Chat Error! (Probably user)\n"+msg);
			//chat.ui.fatalError("Chat Error! (Probably user) <br/>"+msg);
			console.log(msg);
			chat.ui.reload();
		});
		
		this.data = new ChatData();
		
		this.client = new Client();
		this.ui = new Userinterface();
		
		this.bindDataCallbacks();
	}
	init()
	{
		Debug.log("init");

		//var test:TestSystem = new TestSystem(this.data, this.ui, this.client); return;
		
		this.client.connect(
			"http://urtela.redlynx.com:3002",
			//"testiperse2000"
			this.data.localMember.userID
		);
		
		this.ui.setLoading(null);
	}
	bindDataCallbacks()
	{
		var self:Chat = this;
		
		// Data Bindings to update UI
		this.data.onActiveChannelChanged.add(function(channel:ChatChannel)
		{
			self.ui.setActiveChannel(channel);
		});

		this.data.onChannelAdded.add(function(channel:ChatChannel)
		{
			self.ui.initChannelButton(channel);
		});
		
		this.data.onChannelRemoved.add(function(channel:ChatChannel)
		{
			self.ui.removeChannel(channel);
		});
		
		this.data.onActiveChannelMembersChanged.add(function(channel:ChatChannel)
		{
			self.ui.updateChannelMembers(channel);
		});
		
		//this.data.onActiveChannelMessageAdded.add(function(message:ChatMessage)
		this.data.onChannelMessageAdded.add(function(channel:ChatChannel,message:Array<any>)
		{
			self.ui.addMessage(channel,message[0]);
		});
		
		this.data.onChannelTopicChanged.add(function(channel:ChatChannel)
		{
			self.ui.setChannelTopic(channel);
		});
		
		this.data.onServerStatusChanged.add(function(status:string)
		{
			self.ui.setServerStatus(status);
		});
		
		this.data.onMemberStatusChanged.add(function(member:ChatMember)
		{
			Debug.log(member.name+" Status Changed to: "+member.status);
			//self.ui.setServerStatus(status);
		});
		
		//onActiveChannelDataAdded:Signal; // Use For plugins
		
		// UI Bindings to update Data
		this.ui.onActiveChannelChanged.add(function(channel:ChatChannel)
		{
			self.data.setActiveChannelByChannel(channel);
		});
		this.ui.onChannelClosed.add(function(channel:ChatChannel)
		{
			self.client.exitChannel(channel);
			self.data.removeChannelByName(channel.name);
		});
		this.ui.settings.onFileDrop.add(function(file:any)
		{
			self.client.uploadFile(file,self.data.getActiveChannel());
		});
		this.ui.onMessageSend.add(function(msg:string)
		{
			self.client.sendMessage(msg,self.data.getActiveChannel());
		});
		this.ui.onStatusChange.add(function(status:string)
		{
			self.client.setStatus(status);
		});
		this.ui.onPrivateChatStarted.add(function(username:string)
		{
			var channel:ChatChannel = new ChatChannel("@"+username,"Private chat with "+username);
			self.data.addChannel(channel);
			self.data.setActiveChannelByChannel(channel);
			//self.ui.setActiveChannel(channel);
		});
		
		
		// Socket bindings to update data
		this.client.onUserStatusUpdated.add(function(userName:string,data:Array<string>)
		{
			self.data.setUserStatus(userName,data[0]);
		});
		
		this.client.onChatMessage.add(function(message:ChatMessage,data:Array<string>)
		{
			self.data.addMessage(message,data[0]);
		});
		
		this.client.onJoinedChannel.add(function(channelName:string)
		{
			Debug.log("Joined channel: "+channelName);
			var channel = new ChatChannel(channelName,"Welcome to "+channelName);
			self.data.addChannel(channel);
			self.data.setActiveChannelByChannel(channel);
		});
		
		this.client.onUserListUpdated.add(function(channelName:string,data:Array<any>)
		{
			self.data.updateUsers(channelName,data[0]);
		});
		
		this.client.onUserParted.add(function(channelName:string,data:Array<string>)
		{
			self.data.removeMemberByName(data[0],channelName);
			self.data.addMessage(new ChatMessage("","SYSTEM","<div class='user-left'>" + data[0] + " left the channel</div>",ChatMessageType.SYSTEM),channelName);
		});
		
		this.client.onUserJoined.add(function(channelName:string,data:Array<string>)
		{
			self.data.addMember(new ChatMember(data[0],"null","online"),channelName);
			self.data.addMessage(new ChatMessage("","SYSTEM","<div class='user-join'>" + data[0] + " joined the channel</div>",ChatMessageType.SYSTEM),channelName);
		});
		
		this.client.onUserDisconnected.add(function(channelName:string,data:Array<string>)
		{
			self.data.addMember(new ChatMember(data[0],"null","online"),channelName);
			self.data.addMessage(new ChatMessage("","SYSTEM","<div class='user-disconnected'>" + data[0] + " disconnected</div>",ChatMessageType.SYSTEM),channelName);
		});
		
		this.client.onUserNameChanged.add(function(oldName:string,data:Array<string>)
		{
			self.data.changeMemberName(oldName,data[0]);
		});
		
		this.client.onTopicChanged.add(function(channelName:string,data:Array<string>)
		{
			self.data.setTopic(data[0],channelName);
			self.data.addMessage(new ChatMessage("","SYSTEM","Channel topic is "+data[0],ChatMessageType.SYSTEM),channelName);
		});
		
		this.client.onDisconnected.add(function()
		{
			self.data.addMessage(new ChatMessage("","SYSTEM","<div class='user-disconnected'>Disconnected</div>",ChatMessageType.SYSTEM),self.data.getActiveChannel().name);
		});
		
		this.client.onConnected.add(function()
		{
			self.data.restoreActiveChannel();
		});
	}
	static create()
	{
		var chat:Chat = new Chat();
		try
		{
			document.body.onload = function()
			{
				chat.init();
			};
		}
		catch(e)
		{
			document.body.onload = function()
			{
				chat.ui.fatalError("Error while loading chat.<br/>please try again later.");
			}
		}
	}
}