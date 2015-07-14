function ChatUI()
{
}
{
	ChatUI.prototype.init = function(
		channelButtonsContainer,
		messagesContainer,
		channelTopicContainer
	)
	{
		log("Init UI");
		
		this.userchannel = "";
		this.userchannel = getCookie("userchannel");
		if(this.userchannel == "")
		{
			setCookie("userchannel", "lobby", 365);
			this.userchannel = "lobby";
		}
		log("User Channel:"+this.userchannel);
		
		this.useAutoScroll = true;
		this.channelButtonsContainer = channelButtonsContainer;
		this.messagesContainer = messagesContainer;
		this.channelTopicContainer = channelTopicContainer;
		this.initSettings();
		this.focusTextbox();
		this.resizeScreen();
	}
	
	ChatUI.prototype.setAutoScroll = function(scroll)
	{
		this.useAutoScroll = scroll;
	}
	
	ChatUI.prototype.bindActions = function(
		onSetActiveChannel
	)
	{
		this.onSetActiveChannel = onSetActiveChannel;
	}
	
	
	ChatUI.prototype.resizeScreen = function()
	{
		/*
		window.onresize = ui.resizeScreen;
		
		var h = $(window).height() * 0.99;
		var w = $(window).width() * 0.99;
	  
		//$("#channels").height(h * 0.05);
		//$("#channels").width(w * 1.00);
	  
		$(ui.messagesContainer).height(h * 0.75);
		//$(this.messagesContainer).width(w * 0.999);
	  
		ui.messagesScrollToBottom();
		*/
	}
	
	ChatUI.prototype.refreshAutoScrollToggleButton = function()
	{
		var button = $("#auto-scroll-toggle");
		var iconOn = $("#auto-scroll-icon-on");
		var iconOff = $("#auto-scroll-icon-off");
		
		if(this.useAutoScroll)
		{
			button.addClass("btn-info");
			button.removeClass("btn-warning");
			iconOn.show();
			iconOff.hide();
		}
		else
		{
			button.removeClass("btn-info");
			button.addClass("btn-warning");
			iconOff.show();
			iconOn.hide();
		}
	}

	ChatUI.prototype.initSettings = function()
	{
		//init tooltip
		$("#auto-scroll-toggle").tooltip();
		
		this.refreshAutoScrollToggleButton();
		$("#auto-scroll-toggle").click(function()
		{
			ui.useAutoScroll = !ui.useAutoScroll;
			log("Autoscroll toggled: "+ui.useAutoScroll);
			ui.refreshAutoScrollToggleButton();
			ui.messagesScrollToBottom();
		});
		
		var ui = this;
		$("#debug").click(function()
		{
			ui.setLoading("Tsasdasd");
			setTimeout(ui.setLoading,5000);
		});
	}

	ChatUI.prototype.focusTextbox = function()
	{
		$("#message-input").focus();
	}

	ChatUI.prototype.setLoading = function(str)
	{
		if(str==null)
		{
			$("#loading").addClass("ready");	
			$("#loading-text").addClass("ready");
			$("#loading-indicator").removeClass("rotating");
		}
		else
		{
			$("#loading-text").html(str);
			
			$("#loading").removeClass("ready");		
			$("#loading-text").removeClass("ready");
			$("#loading-indicator").addClass("rotating");
		}
	}

	ChatUI.prototype.setServerStatus = function(status)
	{
		log("Server Status: "+status);
		$("#server-status").html(status);
	}
	
	ChatUI.prototype.clearChatMessages = function()
	{
		$(this.messagesContainer).html("");
	}
	
	ChatUI.prototype.setActiveChannel = function(channel)
	{
		log("UI SetActiveChannel:"+channel+ " prev:"+this.userchannel);
		
		var prevChannel = $("#channel_" + this.userchannel);
		if(prevChannel)
		{
			prevChannel.removeClass("btn-success");
		}
		
		setCookie("userchannel", channel, 365);
		this.userchannel = channel;
		
		$("#channel_" + this.userchannel).addClass("btn-success");
		$("#channel_" + this.userchannel).removeClass("btn-info");//if notified
		$("#channel_" + this.userchannel+" .message-count:first").html("");
		ui.clearChatMessages();
		
		this.onSetActiveChannel(channel);
	}
	
	ChatUI.prototype.setTopic = function(topic)
	{
		assert($(this.channelTopicContainer)!=null,"channelTopicContainer is null");
		//$(this.channelTopicContainer).hide();
		$(this.channelTopicContainer).html(topic);
		//$(this.channelTopicContainer).slideDown();
	}
	
	ChatUI.prototype.messagesScrollToBottom = function()
	{
		if(!this.useAutoScroll)
		{
			//$('#auto-scroll-toggle').tooltip('show');
			return;
		}
		
		var h = $(this.messagesContainer)[0].scrollHeight;
		$(ui.messagesContainer).stop().animate({ scrollTop: h}, "slow");
		//$(this.messagesContainer).scrollTop = h;
	}
	
	ChatUI.prototype.initChannelButton = function(channel)
	{
		log("Init button for channel: "+channel);
		
		var existing = $("#channel_" + channel).length > 0;
		var channelButton = $("#channel_" + channel);
		
		if(!existing)
		{
			channelButton = document.createElement("button");
			channelButton.id = "channel_" + channel;
			channelButton.className = "btn";
			channelButton.type = "button";
			
			//Tooltip
			$(channelButton).hover(function()
			{
				if($(channelButton).attr("data-toggle")!="tooltip")
				{
					$(channelButton).attr("data-toggle", "tooltip");
					$(channelButton).attr("data-placement", "bottom");
					$(channelButton).attr("title", client.getTopic(channel));
					$(channelButton).tooltip("show");
				}
				else
				{
					$(channelButton).attr("title", client.getTopic(channel));
				}
			});

			if(this.userchannel == channel)
			{
				$(channelButton).addClass("btn-success");
			}
			
			channelButton.onclick = function()
			{
				log("ChannelButton:"+channel);
				ui.setActiveChannel(channel);
			};
			$(this.channelButtonsContainer).append(channelButton);
			
			var channelName = document.createElement("span");
			channelName.className = "name";
			channelName.innerHTML = channel;
			$(channelButton).append(channelName);
			
			var messages = document.createElement("span");
			messages.className = "message-count badge";
			$(channelButton).append(messages);
		}
		
		return existing;
	}
	
	ChatUI.prototype.newContent = function(channel)
	{
		if(notificationsTemporary == 0)
		{
			var element = $("#channel_" + channel);
			element.addClass("btn-info");
			var name = $("#channel_" + channel+" .name:first");
			
			var count = parseInt($("#channel_" + channel+" .message-count:first").html());
			if(isNaN(count))
			{
				count = 0;
			}
			count++;
			log(count);
			$("#channel_" + channel+" .message-count:first").html(count.toString());
		}
	}
}

function fatalError(str)
{
	var e = document.getElementById("loading");
	e.innerHTML = "<div class='error'>"+str+"</div>";
}