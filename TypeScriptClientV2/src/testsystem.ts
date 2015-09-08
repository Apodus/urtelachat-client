class TestSystem
{
	constructor(data:ChatData,ui:Userinterface,client:Client)
	{
		var channel:ChatChannel = new ChatChannel("lobby","Welvcomse1");
		this.addUsers(channel,10);
		data.addChannel(channel);
		
		channel = new ChatChannel("Kakkamaster2","Welvcomse2");
		this.addUsers(channel,2);
		data.addChannel(channel);
		
		channel = new ChatChannel("Kakkamaster3","Welvcomse3");
		this.addUsers(channel,1);
		data.addChannel(channel);
		
		channel = new ChatChannel("Kakkamaster4","Welvcomse4");
		this.addUsers(channel,4);
		data.addChannel(channel);
		
		channel = new ChatChannel("@Kakkamaster4","Welvcomse4");
		this.addUsers(channel,4);
		data.addChannel(channel);
		
		channel = new ChatChannel("@¯\_(ツ)_/¯","Welvcomse4");
		this.addUsers(channel,4);
		data.addChannel(channel);
		
		//Restore active channel
		data.restoreActiveChannel();
		
		this.addMessage("lobby",data,"User1");
		this.addMessage("lobby",data,"User1");
		this.addMessage("lobby",data,"User1");
		this.addMessage("lobby",data,"User2");
		this.addMessage("lobby",data,"User1");
		this.addMessage("lobby",data,"User2");
		this.addMessage("lobby",data,"User1");
		this.addMessage("lobby",data,"User2");
		this.addMessage("lobby",data,"User1");
		this.addMessage("lobby",data,"User2");
		this.addMessage("lobby",data,"User1");
		
		this.addMessage("Kakkamaster3",data,"User1");
		this.addMessage("Kakkamaster3",data,"User1");
		this.addMessage("Kakkamaster3",data,"User1");
		
		this.addMessage("Kakkamaster2",data,"User1");
		this.addMessage("Kakkamaster2",data,"User1");
		
		this.addMessage("Kakkamaster4",data,"User1");
		this.addMessage("Kakkamaster4",data,"User1");
		this.addMessage("Kakkamaster4",data,"User1");
		this.addMessage("Kakkamaster4",data,"User1");
		
		//this.data.connect("http://urtela.redlynx.com:3001","Zombie");
		//this.ui.setLoading(null);
		//this.ui.setActiveChannel("LobbyTEST");
		ui.setLoading(null);
		
		data.addMember(new ChatMember("LAterJoin","000","idle"),"lobby");
		
		data.setActiveChannelByName("paskanmanrja");
		
		ui.addLog("TestLog1");
		ui.addLog("TestLog2");
		ui.addLog("TestLog3");
	}
	
	addUsers(channel:ChatChannel,count:number)
	{
		for(var i:number = 0; i<count; i++)
		{
			channel.addMember(new ChatMember(channel.name+"_User_"+i,"0"+i,"online"));
		}
	}
	
	addMessage(channelName:string,data:ChatData,sender:string)
	{
		data.addMessage(
			new ChatMessage(
				"0:0",
				sender,
				channelName+" message",
				ChatMessageType.NORMAL
			),
			channelName
		);
	}
}