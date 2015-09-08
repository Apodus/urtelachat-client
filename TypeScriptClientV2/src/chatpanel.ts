class ChatPanel
{
	static activeChatPanel:ChatPanel;
	
	id:number;
	channel:ChatChannel;
	element:HTMLElement;
	useAlternative:boolean;
	lastMessage:ChatMessagePanel;
	
	constructor(channel:ChatChannel)
	{
		this.lastMessage = null;
		this.useAlternative = false;
		this.channel = channel;
		this.id = channel.id;
		this.element = document.createElement("div");
		this.element.id = "CHAT_"+this.id;
		if(!this.channel.isPrivate)
		{
			this.setActive();
		}
	}
	
	addMessage(message:ChatMessage)
	{
		if(this.lastMessage != null && this.lastMessage.message.sender == message.sender)
		{
			this.lastMessage.addMessage(message);
		}
		else
		{
			var messagePanel:ChatMessagePanel = new ChatMessagePanel(message,this.useAlternative);
			this.element.appendChild(messagePanel.element);
			this.lastMessage = messagePanel;
			this.useAlternative = !this.useAlternative;
		}
	}
	setActive()
	{
		Debug.log("Set active chat panel:"+this.channel.name);
		if(ChatPanel.activeChatPanel!=null)
		{
			this.hide();
		}
		ChatPanel.activeChatPanel = this;
		this.show();
	}
	hide()
	{
		Debug.log("Hide active chat panel:"+this.channel.name);
		$(ChatPanel.activeChatPanel.element).stop();
		$(ChatPanel.activeChatPanel.element).hide();
	}
	show()
	{
		Debug.log("Show active chat panel:"+this.channel.name);
		$(ChatPanel.activeChatPanel.element).stop();
		$(ChatPanel.activeChatPanel.element).fadeIn();
	}
	isActive():boolean
	{
		return ChatPanel.activeChatPanel == this;
	}
}