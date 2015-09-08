enum ChatMessageType
{
	NORMAL,
	SYSTEM,
	DATA
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