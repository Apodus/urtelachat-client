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
	
	ChatUI.prototype.serverCommand = function(command)
	{
		ui.reload();
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
		
		$("#debug").hide();
		
		this.addDebugButton("Server Command",function()
		{
			client.serverCommand("Shits and giggles");
		});
		
		this.addDebugButton("User Info",function()
		{
			ui.showUserInfo({name:"User1",uid:123123123,avatar:"<span class='glyphicon glyphicon-user' aria-hidden='true'></span><img src='avatar.png' />",comment:"GTFO"});
		});
		
		this.addDebugButton("Reload",function()
		{
			ui.reload();
		});
	}
	
	ChatUI.prototype.addDebugButton = function (name,callback)
	{
		$("#debug").show();
		//var container = document.createElement("div");
		//container.className = "row";
		
		var button = document.createElement("button");
		button.className = "btn btn-success btn-sm";
		button.type = "button";
		button.innerHTML = name;
		$("#debug").append(button);
		//$(container).append(button);
		$(button).click(callback);
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
	
	ChatUI.prototype.updateUsers = function(users)
	{
		var usersList = document.getElementById("users");
		usersList.innerHTML="";
		
		for(var nickName in users)
		{
			var user = document.createElement("button");
			user.className = "btn btn-block btn-info btn-xs user-label";
			user.innerHTML = '<span class="glyphicon glyphicon-user" aria-hidden="true"></span> '+nickName;
			$(user).click(function()
			{
				ui.showUserInfo({name:nickName, avatar:"<span class='glyphicon glyphicon-user' aria-hidden='true'></span>",comment:"null"});
			});
			usersList.appendChild(user);
		}
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
	
	ChatUI.prototype.closePopup = function()
	{
		log("Closing popups");
		$('.modal').modal('hide');
	}
	
	ChatUI.prototype.reload = function()
	{
		log("Reloading page!");
		
		ui.closePopup();
		
		ui.setLoading("Reloading");
		fatalError("Server Maintenance, please wait...");
		
		var id = setTimeout(function()
		{
			window.location.reload();
		},5000);
	}
	
	ChatUI.prototype.showUserInfo = function(user)
	{
		log("Show user info:"+user);
		this.closePopup();
		$('#userInfo').modal('show');
		
		var content = "";
		var i=0;
		for(var item in user)
		{
			content += "<div class='row"+(i%2?"":" alt")+"'><span class='variable'>"+item+"</span><div class='value pull-right'>"+user[item] + "</div></div>";
			i++;
		}
		
		$('#userInfoBody').html(content);
	}
}

function fatalError(str)
{
	var e = document.getElementById("loading");
	e.innerHTML = "<div class='error'>"+str+"</div>";
}