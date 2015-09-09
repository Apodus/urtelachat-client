class ChatMessagePanel
{
	element:HTMLElement;
	body:HTMLElement;
	who:HTMLElement;
	what:HTMLElement;
	when:HTMLElement;
	message:ChatMessage;
	
	constructor(message:ChatMessage,alt:boolean)
	{
		this.message = message;
		this.element = document.createElement("div");
		this.element.className = "message-block";
		
		this.body = document.createElement("div");
		this.body.className = "message-body row";
		
		this.element.appendChild(this.body);
		
		this.who = document.createElement("span");
		this.what = document.createElement("div");
		this.when = document.createElement("div");
		
		this.body.appendChild(this.who);
		this.body.appendChild(this.what);
		this.body.appendChild(this.when);
		
		this.who.innerHTML = message.sender;
		this.what.innerHTML = Utils.linkify(message.message);
		this.when.innerHTML = message.time;
		
		this.who.className = "label col-md-1 user-label";
		this.what.className = "chat-message col-md-10";
		this.when.className = "time col-md-1 text-right";
		
		switch(message.type)
		{
			case ChatMessageType.SYSTEM:
				$(this.who).addClass("label-info");
				$(this.who).removeClass("user-label");
				$(this.body).addClass("side-bg");
				break;
			case ChatMessageType.NORMAL:
			default:
				$(this.who).addClass("label-success");
				if(alt)
				{
					$(this.body).addClass("alt-bg");
				}
				else
				{
					$(this.body).addClass("main-bg");
				}
			break;
		}
		
		$(this.element).hide();
		$(this.element).fadeIn();
	}
	
	addMessage(message:ChatMessage)
	{
		var newMessage:HTMLElement = document.createElement("span");
		newMessage.innerHTML = "<br/>"+Utils.linkify(message.message);
		
		this.what.appendChild(newMessage);
		
		this.when.innerHTML += "<br/>"+message.time;
		
		$(newMessage).hide();
		$(newMessage).fadeIn();
	}
}