class ChatChannel
{
	name:string;
	topic:string;
	plugins:Array<string>;
	messages:Array<ChatMessage>;
	members:Array<ChatMember>;
	id:number;
	allowNotifications:boolean;
	isPrivate:boolean;
	data:any;
	
	static nextID:number = 0;
	constructor(name:string,topic:string)
	{
		this.id = ChatChannel.nextID++;
		this.name=name;
		this.topic=topic;
		this.messages = new Array<ChatMessage>();
		this.members = new Array<ChatMember>();
		this.allowNotifications = false;
		this.isPrivate = name[0] === "@";
		this.data = {};
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
	setData(key:string,value:string)
	{
		this.data[key]=value;
	}
	getData(key:string):any
	{
		return this.data[key];
	}
}