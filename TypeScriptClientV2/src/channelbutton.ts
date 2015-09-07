class ChannelButton
{
	static activeChannelButton:ChannelButton;
	
	id:number;
	channel:ChatChannel;
	element:HTMLElement;
	
	onCloseClick:Signal;
	onNameClick:Signal;
	onNotificationsToggled:Signal;
	
	newMessages:number;
	newMessagesLabel:HTMLElement;
	
	notificationsButton:HTMLElement;
	
	constructor(channel:ChatChannel)
	{
		this.newMessages = 0;
		this.id = channel.id;
		this.channel = channel;
		this.onCloseClick = new Signal();
		this.onNameClick = new Signal();
		this.onNotificationsToggled = new Signal();
		
		this.element = document.createElement("button");
		
		this.element.id = "CHANNEL_"+this.id;
		this.element.className = "btn channel-button";
		//this.element.type = "button";
			
		var closeButton:HTMLElement = document.createElement("button");
		closeButton.className = "btn btn-warning btn-xs btn-close-channel";
		closeButton.innerHTML = "Close Channel";
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
		
		var addButton:Function = function(text:string,button:HTMLElement)
		{
			var wrapper:HTMLElement = document.createElement("div");
			wrapper.className = "bg-info row well";
			//wrapper.innerHTML = '<div class="bg-info well">'+text+'</div>';
			//$(button).addClass("pull-right");
			$(wrapper).append(button);
			$(settings).append(wrapper);
		}
		
		var settings:HTMLElement = document.createElement("div");
		settings.className = "well channel-settings dropshadow-5";
		settings.innerHTML = 'Channel Settings';
		addButton("Close Channel",closeButton);
		
		var notificationsButton:HTMLElement = document.createElement("button");
		notificationsButton.className = "btn btn-warning btn-xs";
		notificationsButton.innerHTML = "Notifications Disabled";
		addButton("Notifications:",notificationsButton);
		this.notificationsButton = notificationsButton;
		
		
		$(this.element).append(messages);
		$(this.element).append(channelName);
		
		$(this.element).append(settings);
		
		var self:ChannelButton = this;
		$(closeButton).click(function(e:any)
		{
			self.element.onclick = null;
			
			TooltipManager.hideAll();
			self.onCloseClick.send("close");
			//$(settings).slideUp();
			$(settings).stop(true,true).fadeOut();
			e.stopPropagation();
		});
		
		$(this.element).click(function(e:any)
		{
			self.onNameClick.send("open");
			TooltipManager.hideAll();
			e.stopPropagation();
		});
		
		$(this.element).mouseleave(function()
		{
			TooltipManager.hideAll();
			//$(closeButton).fadeOut();
			$(settings).stop(true,true).fadeOut();
			//$(settings).slideUp();
		});
		
		$(this.notificationsButton).click(function(e:any)
		{
			self.onNotificationsToggled.send("");
			e.stopPropagation();
		});

		$(this.element).mouseenter(function()
		{
			//if(channel.name!="lobby")
			//{
				//$(closeButton).fadeIn();
			//}
			
			$(settings).css({position:"fixed",top:"40px",left:$(this).offset().left+"px"});
			$(settings).stop(true,true).fadeIn();
			//$(settings).slideDown();
			
			//TooltipManager.show(this,channel.topic,"bottom");
		});
		//$(closeButton).hide();
		$(settings).hide();
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
	updateChannelSettings()
	{
		if(this.channel.allowNotifications)
		{
			this.notificationsButton.innerHTML = "Notifications Enabled";
			$(this.notificationsButton).addClass("btn-success");
			$(this.notificationsButton).removeClass("btn-warning");
		}
		else
		{
			this.notificationsButton.innerHTML = "Notifications Disabled";
			$(this.notificationsButton).addClass("btn-warning");
			$(this.notificationsButton).removeClass("btn-success");
		}
	}
}