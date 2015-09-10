class ChatMember
{
	name:string;
	userID:string;
	status:string;
	
	opChannels:any;
	
	constructor(name:string,id:string,status:string)
	{
		this.name = name;
		this.userID = id;
		this.status = status;
		this.opChannels = {};
	}
	
	setOpStatus(channel:string,op:boolean)
	{
		this.opChannels[channel] = op;
	}
	
	isOp(channel:string):boolean
	{
		return this.opChannels[channel] == true;
	}
}