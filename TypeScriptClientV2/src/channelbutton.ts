class ChannelButton
{
	static activeChannelButton:ChannelButton;
	
	id:number;
	channel:ChatChannel;
	element:HTMLElement;
	onCloseClick:Signal;
	onNameClick:Signal;
	
	newMessages:number;
	newMessagesLabel:HTMLElement;
	
	constructor(channel:ChatChannel)
	{
		this.newMessages = 0;
		this.id = channel.id;
		this.channel = channel;
		this.onCloseClick = new Signal();
		this.onNameClick = new Signal();
		
		this.element = document.createElement("button");
		
		this.element.id = "CHANNEL_"+this.id;
		this.element.className = "btn channel-button";
		//this.element.type = "button";
			
		var closeButton:HTMLElement = document.createElement("button");
		closeButton.className = "btn btn-warning btn-xs btn-close-channel";
		//closeButton.type = "button";
		//closeButton.id = "close_channel_" + channelID.substring(1);
		//$(closeButton).hide();
		
		var channelName:HTMLElement = document.createElement("span");
		channelName.className = "name";
		channelName.innerHTML = channel.name;
		
			
		var messages:HTMLElement = document.createElement("span");
		messages.className = "message-count badge";
		this.newMessagesLabel = messages;
			
		var closeIcon:HTMLElement = document.createElement("span");
		closeIcon.className = "glyphicon glyphicon-remove";
		$(closeIcon).attr("aria-hidden", "true");
		$(closeButton).append(closeIcon);
		
		$(this.element).append(messages);
		$(this.element).append(channelName);
		$(this.element).append(closeButton);
		
		var self:ChannelButton = this;
		$(closeButton).click(function()
		{
			self.element.onclick = null;
			
			TooltipManager.hideAll();
			self.onCloseClick.send("close");
		});
		
		$(this.element).click(function()
		{
			self.onNameClick.send("open");
			TooltipManager.hideAll();
		});
		
		$(this.element).mouseleave(function()
		{
			TooltipManager.hideAll();
			$(closeButton).fadeOut();
		});

		$(this.element).mouseenter(function()
		{
			if(channel.name!="lobby")
			{
				$(closeButton).fadeIn();
			}
			TooltipManager.show(this,channel.topic,"bottom");
		});
		$(closeButton).hide();
	}
	setActive()
	{
		if(ChannelButton.activeChannelButton!=null)
		{
			$(ChannelButton.activeChannelButton.element).removeClass("btn-info");
			$(ChannelButton.activeChannelButton.element).removeClass("btn-success");
		}
		
		$(this.element).addClass("btn-success");
		$(this.element).removeClass("btn-info");
		
		$(this.newMessagesLabel).empty();
		
		ChannelButton.activeChannelButton = this;
	}
	addNewMarker():void
	{
		this.newMessages++;
		$(this.element).addClass("btn-info");
		$(this.newMessagesLabel).html(this.newMessages.toString());
	}
	isActive():boolean
	{
		return ChannelButton.activeChannelButton == this;
	}
}