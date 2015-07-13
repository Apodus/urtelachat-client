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

	ChatUI.prototype.initSettings = function()
	{
		/*
		var openButton = document.getElementById('settings-open');
		var closeButton = document.getElementById('settings-close');
		
		openButton.onclick = function()
		{
			$("#settings").toggleClass("closed");
		}
		
		closeButton.onclick = function()
		{
			$("#settings").toggleClass("closed");
		}
		*/
		
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
		if(!this.useAutoScroll) return;
		
		var h = $(this.messagesContainer)[0].scrollHeight;
		$(ui.messagesContainer).stop().animate({ scrollTop: h}, "slow");
		//$(this.messagesContainer).scrollTop = h;
	}
	
	ChatUI.prototype.initChannelButton = function(channel)
	{
		log("Init button for channel: "+channel);
		
		var existing = false;
		var channelButton = null;
		
		for(var childIndex in $(this.channelButtonsContainer).childNodes)
		{
			channelButton = $(this.channelButtonsContainer).childNodes[childIndex];
			if(channelButton.innerHTML == channel)
			{
				existing = true;
				break;
			}
		}
	
		if(!existing)
		{
			channelButton = document.createElement("button");
			channelButton.innerHTML = channel;
			channelButton.id = "channel_" + channel;
			channelButton.className = "btn";
			channelButton.type = "button";
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
		}
		
		return existing;
	}
}

function fatalError(str)
{
	var e = document.getElementById("loading");
	e.innerHTML = "<div class='error'>"+str+"</div>";
}