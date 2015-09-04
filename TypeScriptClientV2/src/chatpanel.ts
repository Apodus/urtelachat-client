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
		$(this.element).hide(); // hide as default
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
		if(ChatPanel.activeChatPanel!=null)
		{
			$(ChatPanel.activeChatPanel.element).hide();
		}
		ChatPanel.activeChatPanel = this;
		$(ChatPanel.activeChatPanel.element).fadeIn();
	}
	isActive():boolean
	{
		return ChatPanel.activeChatPanel == this;
	}
}